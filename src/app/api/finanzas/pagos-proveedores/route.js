import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import cookie from "cookie" 

const prisma = new PrismaClient()

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header (para Next.js App Router y API routes modernas)
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  // Fallback: Authorization header (Bearer)
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) {
    console.warn("NO TOKEN FOUND, defaulting to 1")
    return 1
  }

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}


// Función para extraer IP del request
function extraerIP(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (cfConnectingIP) return cfConnectingIP
  if (forwarded) return forwarded.split(",")[0].trim()
  if (realIP) return realIP

  return "IP no disponible"
}

// Función para detectar navegador del User-Agent
function detectarNavegador(userAgent) {
  if (!userAgent) return "Navegador no disponible"

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    const match = userAgent.match(/Chrome\/([0-9.]+)/)
    return `Google Chrome ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/([0-9.]+)/)
    return `Microsoft Edge ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/([0-9.]+)/)
    return `Mozilla Firefox ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/([0-9.]+)/)
    return `Safari ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    const match = userAgent.match(/(?:OPR|Opera)\/([0-9.]+)/)
    return `Opera ${match ? match[1] : "versión desconocida"}`
  }

  return "Navegador no identificado"
}

export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    const data = await request.json()
    const { idFacturaProveedor, montoPago, fechaPago, idMetodoPago, observacion, comprobantePago } = data

    // Validaciones
    if (!idFacturaProveedor || !montoPago || !fechaPago || !idMetodoPago) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    const montoPagoFloat = Number.parseFloat(montoPago)
    if (isNaN(montoPagoFloat) || montoPagoFloat <= 0) {
      return NextResponse.json({ success: false, error: "El monto del pago debe ser mayor a 0" }, { status: 400 })
    }

    // Verificar que la cuenta por pagar existe y está pendiente de pago
    const cuentaPorPagar = await prisma.cuentaPorPagar.findFirst({
      where: {
        idFacturaProveedor: Number.parseInt(idFacturaProveedor),
        deletedAt: null,
      },
      include: {
        facturaProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            estadoFacturaProv: true,
          },
        },
        estadoCuenta: true,
      },
    })

    if (!cuentaPorPagar) {
      return NextResponse.json({ success: false, error: "Cuenta por pagar no encontrada" }, { status: 404 })
    }

    if (cuentaPorPagar.saldoRestante <= 0) {
      return NextResponse.json({ success: false, error: "Esta cuenta ya está completamente pagada" }, { status: 400 })
    }

    if (montoPagoFloat > cuentaPorPagar.saldoRestante) {
      return NextResponse.json(
        { success: false, error: "El monto del pago no puede ser mayor al saldo restante" },
        { status: 400 },
      )
    }

    // Realizar el pago en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registrar el pago
      const nuevoPago = await tx.pagoFacturaProveedor.create({
        data: {
          idFacturaProveedor: Number.parseInt(idFacturaProveedor),
          idCuentaPagar: cuentaPorPagar.idCuentaPagar,
          fechaPago: new Date(fechaPago),
          montoPago: montoPagoFloat,
          idMetodoPago: Number.parseInt(idMetodoPago),
          comprobantePago: comprobantePago || "",
          observaciones: observacion || "",
          operador: userData.idUsuario,
        },
      })

      // 2. Actualizar el saldo de la cuenta por pagar
      const nuevoSaldoRestante = cuentaPorPagar.saldoRestante - montoPagoFloat
      const nuevoMontoPagado = cuentaPorPagar.montoPagado + montoPagoFloat

      const cuentaActualizada = await tx.cuentaPorPagar.update({
        where: {
          idCuentaPagar: cuentaPorPagar.idCuentaPagar,
        },
        data: {
          montoPagado: nuevoMontoPagado,
          saldoRestante: nuevoSaldoRestante,
          // Si el saldo llega a 0, cambiar estado a "Pagada" (ID 3)
          idEstadoCuenta: nuevoSaldoRestante <= 0 ? 3 : cuentaPorPagar.idEstadoCuenta,
          updatedAt: new Date(),
        },
      })

      // 3. Si la cuenta se pagó completamente, actualizar también la factura
      let facturaActualizada = null
      if (nuevoSaldoRestante <= 0) {
        facturaActualizada = await tx.facturaProveedor.update({
          where: {
            idFacturaProveedor: Number.parseInt(idFacturaProveedor),
          },
          data: {
            idEstadoFacturaProv: 3, // Pagada
            updatedAt: new Date(),
          },
        })
      }

      return {
        pago: nuevoPago,
        cuentaActualizada,
        facturaActualizada,
      }
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    // Registrar auditoría del pago
    await auditoriaService.registrarCreacion(
      "PagoFacturaProveedor",
      resultado.pago.idPago,
      {
        factura: cuentaPorPagar.facturaProveedor.nroFactura,
        proveedor: cuentaPorPagar.facturaProveedor.proveedor.empresa.razonSocial,
        montoPago: montoPagoFloat,
        fechaPago,
        saldoAnterior: cuentaPorPagar.saldoRestante,
        nuevoSaldo: cuentaPorPagar.saldoRestante - montoPagoFloat,
        descripcion: `Pago registrado para factura ${cuentaPorPagar.facturaProveedor.nroFactura} - ${cuentaPorPagar.facturaProveedor.proveedor.empresa.razonSocial}`,
      },
      idUsuario,
      direccionIP,
      navegador,
    )

    // Si la cuenta se pagó completamente, registrar auditoría de la actualización de estado
    if (resultado.facturaActualizada) {
      await auditoriaService.registrarActualizacion(
        "FacturaProveedor",
        cuentaPorPagar.idFacturaProveedor,
        cuentaPorPagar.facturaProveedor,
        resultado.facturaActualizada,
        userData.idUsuario,
        direccionIP,
        navegador,
      )
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      message: "Pago registrado exitosamente",
    })
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const idFactura = searchParams.get("idFactura")

    if (!idFactura) {
      return NextResponse.json({ success: false, error: "ID de factura requerido" }, { status: 400 })
    }

    const pagos = await prisma.pagoFacturaProveedor.findMany({
      where: {
        idFacturaProveedor: Number.parseInt(idFactura),
        deletedAt: null,
      },
      include: {
        metodoPago: true,
        facturaProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
          },
        },
        cuentaPorPagar: true,
      },
      orderBy: {
        fechaPago: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      data: pagos,
    })
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

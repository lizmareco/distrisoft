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

export async function GET(request, { params }) {
  try {
    const { id } = await params

    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    // Buscar la factura en el modelo unificado FacturaProveedor
    const factura = await prisma.facturaProveedor.findUnique({
      where: {
        idFacturaProveedor: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
        estadoFacturaProv: true,
        metodoPago: true,
        ordenCompra: {
          include: {
            cotizacionProveedor: true,
          },
        },
        detallesFacturaProveedor: {
          include: {
            detalleCotizacion: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        cuentaPorPagar: true,
        pagosFacturaProveedor: true,
      },
    })

    if (!factura) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Formatear la respuesta para el visor
    const facturaFormateada = {
      idFactura: factura.idFacturaProveedor,
      nroFactura: factura.nroFactura,
      fechaEmision: factura.fechaEmision,
      fechaVencimiento: factura.fechaVencimiento,
      montoTotal: factura.montoTotalFactura,
      tipo: factura.esContado ? "contado" : "credito",
      estado: factura.estadoFacturaProv?.descEstadoFacturaProv || "Sin Estado",
      plazoPago: factura.plazoPago,
      observacion: factura.observacion,
      comprobantePago: factura.comprobantePago,

      // Datos del proveedor
      proveedor: {
        empresa: {
          razonSocial: factura.proveedor?.empresa?.razonSocial,
          ruc: factura.proveedor?.empresa?.ruc,
          direccion: factura.proveedor?.empresa?.direccion,
          telefono: factura.proveedor?.empresa?.telefono,
        },
      },

      // Método de pago (solo para contado)
      metodoPago: factura.metodoPago
        ? {
            descMetodoPago: factura.metodoPago.descMetodoPago,
          }
        : null,

      // Orden de compra
      ordenCompra: factura.ordenCompra
        ? {
            idOrdenCompra: factura.ordenCompra.idOrdenCompra,
          }
        : null,

      // Detalles de materias primas
      detalles:
        factura.detallesFacturaProveedor?.map((detalle) => ({
          cantidadFacturada: detalle.cantidadFacturada,
          precioUnitarioFinal: detalle.precioUnitarioFinal,
          subtotalFinal: detalle.subtotalFinal,
          observacion: detalle.observacion,
          detalleCotizacion: {
            materiaPrima: {
              nombreMateriaPrima: detalle.detalleCotizacion?.materiaPrima?.nombreMateriaPrima,
              descMateriaPrima: detalle.detalleCotizacion?.materiaPrima?.descMateriaPrima,
            },
          },
        })) || [],

      // Cuenta por pagar (solo para crédito)
      cuentaPorPagar: factura.cuentaPorPagar,

      // Pagos realizados
      pagos: factura.pagosFacturaProveedor || [],
    }

    return NextResponse.json({
      success: true,
      data: facturaFormateada,
    })
  } catch (error) {
    console.error("Error al obtener factura de proveedor:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    const data = await request.json()
    const { idEstadoFacturaProv, observacion } = data

    if (!idEstadoFacturaProv) {
      return NextResponse.json({ success: false, error: "Estado de factura requerido" }, { status: 400 })
    }

    // Obtener factura anterior para auditoría
    const facturaAnterior = await prisma.facturaProveedor.findUnique({
      where: {
        idFacturaProveedor: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
    })

    if (!facturaAnterior) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Actualizar la factura
    const facturaActualizada = await prisma.facturaProveedor.update({
      where: {
        idFacturaProveedor: Number.parseInt(id),
      },
      data: {
        idEstadoFacturaProv: Number.parseInt(idEstadoFacturaProv),
        observacion: observacion || facturaAnterior.observacion,
        updatedAt: new Date(),
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
        estadoFacturaProv: true,
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    // Registrar auditoría
    await auditoriaService.registrarActualizacion(
      "FacturaProveedor",
      Number.parseInt(id),
      facturaAnterior,
      facturaActualizada,
      idUsuario, 
      direccionIP,
      navegador,
    )

    return NextResponse.json({
      success: true,
      data: facturaActualizada,
      message: "Factura actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar factura de proveedor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    // Obtener factura para auditoría
    const facturaAnterior = await prisma.facturaProveedor.findUnique({
      where: {
        idFacturaProveedor: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
    })

    if (!facturaAnterior) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Soft delete
    await prisma.facturaProveedor.update({
      where: {
        idFacturaProveedor: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    // Registrar auditoría
    await auditoriaService.registrarEliminacion(
      "FacturaProveedor",
      Number.parseInt(id),
      facturaAnterior,
      idUsuario,
      direccionIP,
      navegador,
    )

    return NextResponse.json({
      success: true,
      message: "Factura eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar factura de proveedor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

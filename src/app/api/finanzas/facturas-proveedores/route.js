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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const proveedor = searchParams.get("proveedor")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    const whereClause = {
      deletedAt: null,
    }

    // Filtros
    if (proveedor) {
      whereClause.proveedor = {
        empresa: {
          razonSocial: { contains: proveedor, mode: "insensitive" },
        },
      }
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fechaEmision = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      }
    }

    if (tipo === "contado") {
      whereClause.esContado = true
    } else if (tipo === "credito") {
      whereClause.esContado = false
    }

    if (estado) {
      whereClause.estadoFacturaProv = {
        descEstadoFacturaProv: estado,
      }
    }

    const facturas = await prisma.facturaProveedor.findMany({
      where: whereClause,
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
      orderBy: {
        fechaEmision: "desc",
      },
    })

    // Formatear respuesta
    const facturasFormateadas = facturas.map((f) => ({
      idFactura: f.idFacturaProveedor,
      tipo: f.esContado ? "contado" : "credito",
      nroFactura: f.nroFactura,
      fechaEmision: f.fechaEmision,
      fechaVencimiento: f.fechaVencimiento,
      proveedor: f.proveedor.empresa.razonSocial,
      montoTotal: f.montoTotalFactura,
      estado: f.estadoFacturaProv?.descEstadoFacturaProv || "Sin Estado",
      metodoPago: f.metodoPago?.descMetodoPago,
      comprobantePago: f.comprobantePago,
      ordenCompra: f.ordenCompra?.idOrdenCompra,
      plazoPago: f.plazoPago,
      observacion: f.observacion,
      detalles: f.detallesFacturaProveedor,
      cuentaPorPagar: f.cuentaPorPagar,
      pagos: f.pagosFacturaProveedor,
    }))

    return NextResponse.json({
      success: true,
      data: facturasFormateadas,
    })
  } catch (error) {
    console.error("Error al obtener facturas de proveedores:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    const data = await request.json()
    const {
      idOrdenCompra,
      nroFactura,
      fechaEmision,
      esContado, // true = contado, false = crédito
      // Campos para contado
      idMetodoPago = null,
      comprobantePago = null,
      // Campos para crédito
      fechaVencimiento = null,
      plazoPago = null,
      // Opcional
      observacion = null,
    } = data

    // Validaciones básicas
    if (!idOrdenCompra || !nroFactura || !fechaEmision || esContado === undefined) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Validaciones específicas por tipo
    if (esContado && !idMetodoPago) {
      return NextResponse.json(
        { success: false, error: "Método de pago requerido para factura al contado" },
        { status: 400 },
      )
    }

    if (!esContado && (!fechaVencimiento || !plazoPago)) {
      return NextResponse.json(
        { success: false, error: "Fecha de vencimiento y plazo de pago requeridos para factura a crédito" },
        { status: 400 },
      )
    }

    // Obtener datos de la orden de compra
    const ordenCompra = await prisma.ordenCompra.findUnique({
      where: { idOrdenCompra: Number.parseInt(idOrdenCompra) },
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
      },
    })

    if (!ordenCompra) {
      return NextResponse.json({ success: false, error: "Orden de compra no encontrada" }, { status: 404 })
    }

    // Verificar que no exista ya una factura para esta orden
    const facturaExistente = await prisma.facturaProveedor.findFirst({
      where: {
        idOrdenCompra: Number.parseInt(idOrdenCompra),
        deletedAt: null,
      },
    })

    if (facturaExistente) {
      return NextResponse.json(
        { success: false, error: "Ya existe una factura para esta orden de compra" },
        { status: 400 },
      )
    }

    // Crear la factura en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear la factura
      const nuevaFactura = await tx.facturaProveedor.create({
        data: {
          nroFactura,
          idProveedor: ordenCompra.cotizacionProveedor.idProveedor,
          idOrdenCompra: Number.parseInt(idOrdenCompra),
          fechaEmision: new Date(fechaEmision),
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          montoTotalFactura: ordenCompra.cotizacionProveedor.montoTotal,
          esContado,
          plazoPago: plazoPago ? Number.parseInt(plazoPago) : null,
          idEstadoFacturaProv: esContado ? 3 : 1, // 3 = Pagada (contado), 1 = Registrada (crédito)
          idMetodoPago: idMetodoPago ? Number.parseInt(idMetodoPago) : null,
          comprobantePago,
          observacion,
          operador: userData.idUsuario,
        },
      })

      // 2. Crear los detalles de la factura basados en la cotización
      const detallesFactura = await Promise.all(
        ordenCompra.cotizacionProveedor.detallesCotizacionProv.map((detalle) =>
          tx.detalleFacturaProveedor.create({
            data: {
              idFacturaProveedor: nuevaFactura.idFacturaProveedor,
              idDetalleCotizacion: detalle.idDetalleCotizacionProv,
              cantidadFacturada: detalle.cantidad,
              precioUnitarioFinal: detalle.precioUnitario,
              subtotalFinal: detalle.subtotal,
              observacion: null,
            },
          }),
        ),
      )

      // 3. Si es a crédito, crear la cuenta por pagar
      let cuentaPorPagar = null
      if (!esContado) {
        cuentaPorPagar = await tx.cuentaPorPagar.create({
          data: {
            idFacturaProveedor: nuevaFactura.idFacturaProveedor,
            montoOriginal: ordenCompra.cotizacionProveedor.montoTotal,
            montoPagado: 0,
            saldoRestante: ordenCompra.cotizacionProveedor.montoTotal,
            fechaVencimiento: new Date(fechaVencimiento),
            diasVencido: 0, // Inicialmente 0 días vencido
            idEstadoCuenta: 1, // 1 = Vigente (según los estados que proporcionaste)
            observaciones: null,
          },
        })
      }

      return {
        factura: nuevaFactura,
        detalles: detallesFactura,
        cuentaPorPagar,
      }
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    // Registrar auditoría
    await auditoriaService.registrarCreacion(
      "FacturaProveedor",
      resultado.factura.idFacturaProveedor,
      {
        nroFactura,
        proveedor: ordenCompra.cotizacionProveedor.proveedor.empresa.razonSocial,
        tipo: esContado ? "contado" : "crédito",
        montoTotal: ordenCompra.cotizacionProveedor.montoTotal,
        fechaEmision,
        ordenCompra: idOrdenCompra,
        descripcion: `Factura ${esContado ? "contado" : "crédito"} de proveedor registrada - ${
          ordenCompra.cotizacionProveedor.proveedor.empresa.razonSocial
        } - Nro: ${nroFactura} - Estado: ${esContado ? "Pagada" : "Registrada"}`,
      },
      idUsuario,
      direccionIP,
      navegador,
    )

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Factura ${esContado ? "al contado" : "a crédito"} registrada exitosamente`,
    })
  } catch (error) {
    console.error("Error al registrar factura de proveedor:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const json = await request.json()
    const { idFacturaProveedor, ...updateData } = json

    const factura = await prisma.facturaProveedor.update({
      where: {
        idFacturaProveedor: idFacturaProveedor,
      },
      data: updateData,
    })

    return NextResponse.json(factura)
  } catch (error) {
    console.error("Error updating factura:", error)
    return NextResponse.json({ message: "Error updating factura" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const idFacturaProveedor = searchParams.get("idFacturaProveedor")

    await prisma.facturaProveedor.delete({
      where: {
        idFacturaProveedor: Number.parseInt(idFacturaProveedor),
      },
    })

    return NextResponse.json({ message: "Factura deleted" })
  } catch (error) {
    console.error("Error deleting factura:", error)
    return NextResponse.json({ message: "Error deleting factura" }, { status: 500 })
  }
}

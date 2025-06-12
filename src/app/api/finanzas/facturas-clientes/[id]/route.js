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

export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID de factura inválido" }, { status: 400 })
    }

    // Obtener datos completos de la factura con todas las relaciones
    const factura = await prisma.facturaCliente.findUnique({
      where: { nroFactura: id },
      include: {
        cliente: {
          include: {
            persona: true,
          },
        },
        estadoFactuCliente: true,
        metodoPago: true,
        detalleFactura: {
          include: {
            producto: {
              include: {
                tipoProducto: true,
                unidadMedida: true,
              },
            },
            impuesto: true,
          },
        },
        cuentaPorCobrar: {
          include: {
            estadoCuenta: true,
          },
        },
        pagos: {
          include: {
            metodoPago: true,
            usuario: {
              include: {
                persona: true,
              },
            },
          },
          orderBy: {
            fechaPago: "desc",
          },
        },
      },
    })

    if (!factura) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Obtener todas las notas de crédito asociadas a la factura
    const notasCredito = await prisma.notaCredito.findMany({
      where: { idFacturaOrigen: id },
      include: {
        detallesNota: true,
      },
    })
    const totalNotasCredito = notasCredito.reduce((sum, n) => sum + Number(n.montoTotal), 0)
    // Calcular total acreditado por cada detalle
    const acreditadoPorDetalle = {}
    notasCredito.forEach(nc => {
      nc.detallesNota.forEach(det => {
        acreditadoPorDetalle[det.idDetalleFactura] = (acreditadoPorDetalle[det.idDetalleFactura] || 0) + det.cantidad
      })
    })

    // Formatear respuesta con datos reales
    const facturaFormateada = {
      nroFactura: factura.nroFactura,
      fechaEmision: factura.fechaEmision,
      fechaVencimiento: factura.fechaVencimiento,
      esContado: factura.esContado,
      montoTotalFactura: Number.parseFloat(factura.montoTotalFactura),
      observacion: factura.observacion,

      // Datos del cliente
      cliente: {
        nombre: factura.cliente?.persona
          ? `${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`
          : `Cliente #${factura.cliente?.idCliente || "N/A"}`,
        ruc: factura.cliente?.persona?.nroDocumento || "N/A",
        direccion: factura.cliente?.persona?.direccion || "N/A",
      },

      // Estado y método de pago
      estado: factura.estadoFactuCliente?.descEstFactCliente || "Sin estado",
      metodoPago: factura.metodoPago?.descMetodoPago || "Sin método",

      // Detalles de la factura con datos reales
      detalles: factura.detalleFactura.map((detalle) => ({
        idDetalleFactura: detalle.idDetalleFactura,
        cantidad: detalle.cantidad, // Cantidad en paquetes
        descripcion: detalle.producto?.nombreProducto || "Producto sin nombre",
        precioUnitario: Number.parseFloat(detalle.precioUnitario), // Precio por paquete
        subtotal: Number.parseFloat(detalle.subtotal),
        montoImpuesto: Number.parseFloat(detalle.montoImpuesto),
        totalLinea: Number.parseFloat(detalle.totalLinea),
        tipoProducto: detalle.producto?.tipoProducto?.descTipoProducto || "Sin tipo",
        pesoUnidad: detalle.producto?.pesoUnidad || 0,
        unidadesPorPaquete: detalle.producto?.unidadesPorPaquete || 1,
        impuesto: detalle.impuesto?.descImpuesto || "Sin impuesto",
        acreditado: acreditadoPorDetalle[detalle.idDetalleFactura] || 0,
      })),

      // Información específica para crédito
      cuentaPorCobrar: factura.cuentaPorCobrar
        ? {
            saldoRestante: Number.parseFloat(factura.cuentaPorCobrar.saldoRestante),
            diasVencido: factura.cuentaPorCobrar.diasVencido,
            estadoCuenta: factura.cuentaPorCobrar.estadoCuenta?.descEstadoCuenta || "Sin estado",
          }
        : null,

      // Pagos realizados
      pagos: factura.pagos.map((pago) => ({
        idPago: pago.idPago,
        fechaPago: pago.fechaPago,
        montoPago: Number.parseFloat(pago.montoPago),
        metodoPago: pago.metodoPago?.descMetodoPago || "Sin método",
        comprobantePago: pago.comprobantePago,
        observaciones: pago.observaciones,
        operador: pago.usuario?.persona
          ? `${pago.usuario.persona.nombre} ${pago.usuario.persona.apellido}`
          : "Operador desconocido",
      })),

      totalNotasCredito,
    }

    return NextResponse.json({
      success: true,
      data: facturaFormateada,
    })
  } catch (error) {
    console.error("Error al obtener factura:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()
    const { observacion, idEstadoFactuCliente, operador = 1 } = data

    // Validaciones
    if (!id) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const idFactura = Number.parseInt(id)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idFactura) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "IDs inválidos" }, { status: 400 })
    }

    // Obtener datos anteriores
    const facturaAnterior = await prisma.facturaCliente.findUnique({
      where: { nroFactura: idFactura },
      include: {
        cliente: { include: { persona: true } },
        estadoFactuCliente: true,
      },
    })

    if (!facturaAnterior) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Actualizar factura
    const facturaActualizada = await prisma.facturaCliente.update({
      where: { nroFactura: idFactura },
      data: {
        ...(observacion && { observacion }),
        ...(idEstadoFactuCliente && { idEstadoFactuCliente: Number.parseInt(idEstadoFactuCliente) }),
        updatedAt: new Date(),
      },
      include: {
        cliente: { include: { persona: true } },
        estadoFactuCliente: true,
      },
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
   const idUsuario = await getUserIdFromRequest(request)
    await auditoriaService.registrarActualizacion(
      "FacturaCliente",
      idFactura,
      {
        observacion: facturaAnterior.observacion,
        estado: facturaAnterior.estadoFactuCliente.descEstFactCliente,
        fechaActualizacion: facturaAnterior.updatedAt,
      },
      {
        observacion: facturaActualizada.observacion,
        estado: facturaActualizada.estadoFactuCliente.descEstFactCliente,
        fechaActualizacion: new Date().toISOString(),
        descripcion: `Factura actualizada - Cliente: ${facturaActualizada.cliente.persona.nombre} ${facturaActualizada.cliente.persona.apellido}`,
      },
      idUsuario,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      data: facturaActualizada,
      message: "Factura actualizada exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar factura:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const operador = searchParams.get("operador") || "1"

    // Validaciones
    if (!id) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const idFactura = Number.parseInt(id)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(idFactura) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "IDs inválidos" }, { status: 400 })
    }

    // Obtener datos antes de eliminar
    const facturaAnterior = await prisma.facturaCliente.findUnique({
      where: { nroFactura: idFactura },
      include: {
        cliente: { include: { persona: true } },
        estadoFactuCliente: true,
        metodoPago: true,
        pagos: true,
      },
    })

    if (!facturaAnterior) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    // Verificar que no tenga pagos registrados (para facturas a crédito)
    if (!facturaAnterior.esContado && facturaAnterior.pagos.length > 0) {
      return NextResponse.json(
        { success: false, error: "No se puede eliminar una factura con pagos registrados" },
        { status: 400 },
      )
    }

    // Soft delete
    await prisma.facturaCliente.update({
      where: { nroFactura: idFactura },
      data: { deletedAt: new Date() },
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    await auditoriaService.registrarEliminacion(
      "FacturaCliente",
      idFactura,
      {
        cliente: `${facturaAnterior.cliente.persona.nombre} ${facturaAnterior.cliente.persona.apellido}`,
        montoTotal: facturaAnterior.montoTotalFactura,
        fechaEmision: facturaAnterior.fechaEmision,
        estado: facturaAnterior.estadoFactuCliente.descEstFactCliente,
        tipo: facturaAnterior.esContado ? "contado" : "credito",
        observacion: facturaAnterior.observacion,
        descripcion: `Factura eliminada - Cliente: ${facturaAnterior.cliente.persona.nombre} ${facturaAnterior.cliente.persona.apellido}`,
      },
      idUsuario,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      message: "Factura eliminada exitosamente",
    })
  } catch (error) {
    console.error("Error al eliminar factura:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

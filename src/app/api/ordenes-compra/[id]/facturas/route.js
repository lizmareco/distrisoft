import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { id } = params
    const idOrdenCompra = Number.parseInt(id)

    if (!idOrdenCompra || isNaN(idOrdenCompra)) {
      return NextResponse.json({ success: false, error: "ID de orden de compra inválido" }, { status: 400 })
    }

    // Obtener la orden de compra con sus facturas asociadas
    const ordenCompra = await prisma.ordenCompra.findUnique({
      where: { idOrdenCompra },
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
          },
        },
        facturaProveedor: {
          where: { deletedAt: null },
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            estadoFacturaProv: true,
            metodoPago: true,
            cuentaPorPagar: {
              include: {
                estadoCuenta: true,
              },
            },
            pagosFacturaProveedor: {
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
            detallesFacturaProveedor: {
              include: {
                detalleCotizacion: {
                  include: {
                    materiaPrima: true,
                  },
                },
              },
            },
          },
          orderBy: {
            fechaEmision: "desc",
          },
        },
      },
    })

    if (!ordenCompra) {
      return NextResponse.json({ success: false, error: "Orden de compra no encontrada" }, { status: 404 })
    }

    // Formatear las facturas para la respuesta
    const facturasFormateadas = ordenCompra.facturaProveedor.map((factura) => ({
      idFactura: factura.idFacturaProveedor,
      nroFactura: factura.nroFactura,
      fechaEmision: factura.fechaEmision,
      fechaVencimiento: factura.fechaVencimiento,
      montoTotal: factura.montoTotalFactura,
      tipo: factura.esContado ? "contado" : "credito",
      estado: factura.estadoFacturaProv?.descEstadoFacturaProv || "Sin Estado",
      metodoPago: factura.metodoPago?.descMetodoPago,
      comprobantePago: factura.comprobantePago,
      plazoPago: factura.plazoPago,
      observacion: factura.observacion,
      
      // Información del proveedor
      proveedor: {
        razonSocial: factura.proveedor?.empresa?.razonSocial,
        ruc: factura.proveedor?.empresa?.ruc,
        direccion: factura.proveedor?.empresa?.direccion,
        telefono: factura.proveedor?.empresa?.telefono,
      },

      // Información específica para crédito
      cuentaPorPagar: factura.cuentaPorPagar ? {
        saldoRestante: factura.cuentaPorPagar.saldoRestante,
        montoPagado: factura.cuentaPorPagar.montoPagado,
        diasVencido: factura.cuentaPorPagar.diasVencido,
        estadoCuenta: factura.cuentaPorPagar.estadoCuenta?.descEstadoCuenta,
        fechaVencimiento: factura.cuentaPorPagar.fechaVencimiento,
      } : null,

      // Pagos realizados
      pagos: factura.pagosFacturaProveedor.map((pago) => ({
        idPago: pago.idPago,
        fechaPago: pago.fechaPago,
        montoPago: pago.montoPago,
        metodoPago: pago.metodoPago?.descMetodoPago,
        comprobantePago: pago.comprobantePago,
        operador: `${pago.usuario?.persona?.nombre || ""} ${pago.usuario?.persona?.apellido || ""}`.trim(),
        observaciones: pago.observaciones,
      })),

      // Detalles de la factura
      detalles: factura.detallesFacturaProveedor.map((detalle) => ({
        cantidadFacturada: detalle.cantidadFacturada,
        precioUnitarioFinal: detalle.precioUnitarioFinal,
        subtotalFinal: detalle.subtotalFinal,
        observacion: detalle.observacion,
        materiaPrima: {
          nombreMateriaPrima: detalle.detalleCotizacion?.materiaPrima?.nombreMateriaPrima,
          descMateriaPrima: detalle.detalleCotizacion?.materiaPrima?.descMateriaPrima,
        },
      })),

      // Estadísticas
      totalPagos: factura.pagosFacturaProveedor.reduce((sum, pago) => sum + pago.montoPago, 0),
      saldoPendiente: factura.esContado ? 0 : (factura.cuentaPorPagar?.saldoRestante || factura.montoTotalFactura),
    }))

    // Información de la orden de compra
    const ordenInfo = {
      idOrdenCompra: ordenCompra.idOrdenCompra,
      fechaOrden: ordenCompra.fechaOrden,
      estado: ordenCompra.estadoOrdenCompra?.descEstadoOrdenCompra,
      observacion: ordenCompra.observacion,
      proveedor: {
        razonSocial: ordenCompra.cotizacionProveedor?.proveedor?.empresa?.razonSocial,
        ruc: ordenCompra.cotizacionProveedor?.proveedor?.empresa?.ruc,
      },
      montoTotalCotizacion: ordenCompra.cotizacionProveedor?.montoTotal || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        ordenCompra: ordenInfo,
        facturas: facturasFormateadas,
        totalFacturas: facturasFormateadas.length,
        totalMontoFacturado: facturasFormateadas.reduce((sum, f) => sum + f.montoTotal, 0),
        totalPagosRealizados: facturasFormateadas.reduce((sum, f) => sum + f.totalPagos, 0),
        totalSaldoPendiente: facturasFormateadas.reduce((sum, f) => sum + f.saldoPendiente, 0),
      },
    })
  } catch (error) {
    console.error("Error al obtener facturas de la orden de compra:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 
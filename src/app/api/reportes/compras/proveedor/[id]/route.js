import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

// GET - Obtener detalle completo de una compra específica
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo detalle de compra con ID: ${id}`)

    const compra = await prisma.facturaProveedor.findUnique({
      where: {
        idFacturaProveedor: Number(id),
        deletedAt: null,
      },
      include: {
        proveedor: {
          include: {
            empresa: {
              include: {
                tipoDocumento: {
                  select: {
                    idTipoDocumento: true,
                    descTipoDocumento: true,
                  },
                },
                categoriaEmpresa: {
                  select: {
                    idCategoriaEmpresa: true,
                    descCategoriaEmpresa: true,
                  },
                },
                ciudad: {
                  select: {
                    idCiudad: true,
                    nombreCiudad: true,
                  },
                },
              },
            },
          },
        },
        estadoFacturaProv: true,
        metodoPago: true,
        ordenCompra: {
          include: {
            estadoOrdenCompra: true,
            cotizacionProveedor: {
              select: {
                idCotizacionProveedor: true,
                fechaCotizacionProveedor: true,
                validez: true,
                montoTotal: true,
                estado: true,
              },
            },
          },
        },
        usuario: {
          include: {
            persona: {
              select: {
                nombre: true,
                apellido: true,
                correoPersona: true,
                nroTelefono: true,
              },
            },
            rol: {
              select: {
                idRol: true,
                descRol: true,
              },
            },
          },
        },
        detallesFacturaProveedor: {
          include: {
            detalleCotizacion: {
              include: {
                materiaPrima: {
                  include: {
                    estadoMateriaPrima: true,
                  },
                },
                cotizacionProveedor: {
                  select: {
                    idCotizacionProveedor: true,
                    fechaCotizacionProveedor: true,
                  },
                },
              },
            },
          },
          orderBy: {
            idDetalleFactura: "asc",
          },
        },
        // Cuenta por pagar con los campos correctos
        cuentaPorPagar: {
          include: {
            estadoCuenta: {
              select: {
                idEstadoCuentaPagar: true,
                descEstadoCuentaPagar: true,
              },
            },
            pagosFacturaProveedor: {
              include: {
                metodoPago: {
                  select: {
                    idMetodoPago: true,
                    descMetodoPago: true,
                  },
                },
              },
              orderBy: {
                fechaPago: "desc",
              },
            },
          },
        },
        // Pagos directos de la factura
        pagosFacturaProveedor: {
          include: {
            metodoPago: {
              select: {
                idMetodoPago: true,
                descMetodoPago: true,
              },
            },
          },
          orderBy: {
            fechaPago: "desc",
          },
        },
      },
    })

    if (!compra) {
      console.log(`API: No se encontró compra con ID: ${id}`)
      return NextResponse.json({ error: "Compra no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Calcular información adicional
    const resumen = {
      cantidadItems: compra.detallesFacturaProveedor.length,
      cantidadTotalProductos: compra.detallesFacturaProveedor.reduce(
        (sum, detalle) => sum + detalle.cantidadFacturada,
        0,
      ),
      montoSubtotal: compra.detallesFacturaProveedor.reduce((sum, detalle) => sum + detalle.subtotalFinal, 0),
      estadoPago: compra.esContado ? "CONTADO" : compra.cuentaPorPagar?.estadoCuenta?.descEstadoCuentaPagar || "N/A",
      saldoPendiente: compra.cuentaPorPagar?.saldoRestante || 0,
      montoPagado: compra.cuentaPorPagar?.montoPagado || compra.montoTotalFactura,
      diasVencido: compra.cuentaPorPagar?.diasVencido || 0,
      fechaVencimiento: compra.cuentaPorPagar?.fechaVencimiento || null,
      totalPagos: compra.pagosFacturaProveedor?.length || 0,
    }

    console.log(`API: Compra encontrada con ${resumen.cantidadItems} items`)

    return NextResponse.json(
      {
        compra,
        resumen,
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error(`API: Error al obtener compra con ID ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener detalle de compra",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

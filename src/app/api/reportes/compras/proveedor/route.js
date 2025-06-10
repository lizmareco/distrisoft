import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

// GET - Obtener compras por proveedor (SOLO LECTURA)
export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const idProveedor = searchParams.get("idProveedor")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const estado = searchParams.get("estado")
    const tipoFactura = searchParams.get("tipoFactura") // 'contado' o 'credito'

    console.log("API: Buscando compras con parámetros:", {
      idProveedor,
      fechaInicio,
      fechaFin,
      estado,
      tipoFactura,
    })

    // Construir filtros dinámicamente
    const filtros = {
      deletedAt: null,
    }

    // Filtro por proveedor específico
    if (idProveedor) {
      filtros.idProveedor = Number(idProveedor)
    }

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      filtros.fechaEmision = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      }
    } else if (fechaInicio) {
      filtros.fechaEmision = {
        gte: new Date(fechaInicio),
      }
    } else if (fechaFin) {
      filtros.fechaEmision = {
        lte: new Date(fechaFin),
      }
    }

    // Filtro por estado de factura
    if (estado) {
      filtros.idEstadoFacturaProv = Number(estado)
    }

    // Filtro por tipo de factura (contado/crédito)
    if (tipoFactura) {
      filtros.esContado = tipoFactura === "contado"
    }

    const compras = await prisma.facturaProveedor.findMany({
      where: filtros,
      include: {
        proveedor: {
          include: {
            empresa: {
              select: {
                idEmpresa: true,
                razonSocial: true,
                ruc: true,
                telefono: true,
                correoEmpresa: true,
                direccionEmpresa: true,
                contacto: true,
              },
            },
          },
        },
        estadoFacturaProv: {
          select: {
            idEstadoFacturaProveedor: true,
            descEstadoFacturaProv: true,
          },
        },
        metodoPago: {
          select: {
            idMetodoPago: true,
            descMetodoPago: true,
          },
        },
        ordenCompra: {
          select: {
            idOrdenCompra: true,
            fechaOrden: true,
            observacion: true,
          },
        },
        usuario: {
          select: {
            idUsuario: true,
            nombreUsuario: true,
            persona: {
              select: {
                nombre: true,
                apellido: true,
                correoPersona: true,
              },
            },
          },
        },
        detallesFacturaProveedor: {
          include: {
            detalleCotizacion: {
              include: {
                materiaPrima: {
                  select: {
                    idMateriaPrima: true,
                    nombreMateriaPrima: true,
                    descMateriaPrima: true,
                  },
                },
              },
            },
          },
        },
        // Cuenta por pagar con los campos correctos del modelo
        cuentaPorPagar: {
          select: {
            idCuentaPagar: true,
            montoOriginal: true,
            montoPagado: true,
            saldoRestante: true,
            fechaVencimiento: true,
            diasVencido: true,
            idEstadoCuenta: true,
            observaciones: true,
          },
        },
      },
      orderBy: {
        fechaEmision: "desc",
      },
    })

    // Calcular totales y estadísticas
    const estadisticas = {
      totalCompras: compras.length,
      montoTotalGeneral: compras.reduce((sum, compra) => sum + compra.montoTotalFactura, 0),
      comprasContado: compras.filter((c) => c.esContado).length,
      comprasCredito: compras.filter((c) => !c.esContado).length,
      montoContado: compras.filter((c) => c.esContado).reduce((sum, c) => sum + c.montoTotalFactura, 0),
      montoCredito: compras.filter((c) => !c.esContado).reduce((sum, c) => sum + c.montoTotalFactura, 0),
      // Estadísticas adicionales para cuentas por pagar
      totalSaldoPendiente: compras
        .filter((c) => !c.esContado && c.cuentaPorPagar)
        .reduce((sum, c) => sum + c.cuentaPorPagar.saldoRestante, 0),
      totalMontoPagado: compras
        .filter((c) => !c.esContado && c.cuentaPorPagar)
        .reduce((sum, c) => sum + c.cuentaPorPagar.montoPagado, 0),
      facturasPendientes: compras.filter((c) => !c.esContado && c.cuentaPorPagar && c.cuentaPorPagar.saldoRestante > 0)
        .length,
      facturasVencidas: compras.filter((c) => !c.esContado && c.cuentaPorPagar && c.cuentaPorPagar.diasVencido > 0)
        .length,
    }

    console.log(`API: Se encontraron ${compras.length} compras`)

    return NextResponse.json(
      {
        compras,
        estadisticas,
        filtrosAplicados: {
          idProveedor,
          fechaInicio,
          fechaFin,
          estado,
          tipoFactura,
        },
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al obtener compras por proveedor:", error)
    return NextResponse.json(
      {
        error: "Error al obtener compras por proveedor",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


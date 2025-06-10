import { NextResponse } from 'next/server'
import { prisma } from "@/prisma/client"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const idMateriaPrima = searchParams.get('idMateriaPrima')
    const idEstado = searchParams.get('idEstado')
    const agruparPorProveedor = searchParams.get('agruparPorProveedor') === 'true'

    // Construir condiciones de filtrado
    let whereCondition = {}

    if (idMateriaPrima) {
      whereCondition.detalleCotizacion = {
        ...whereCondition.detalleCotizacion,
        idMateriaPrima: parseInt(idMateriaPrima)
      }
    }

    if (idEstado) {
      whereCondition.detalleCotizacion = {
        ...whereCondition.detalleCotizacion,
        materiaPrima: {
          ...(whereCondition.detalleCotizacion?.materiaPrima || {}),
          idEstadoMateriaPrima: parseInt(idEstado)
        }
      }
    }

    // Obtener datos de la base de datos
    const detallesFactura = await prisma.detalleFacturaProveedor.findMany({
      where: whereCondition,
      include: {
        facturaProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true
              }
            },
            // La orden de compra se puede incluir para otros usos
            ordenCompra: {
              include: {
                estadoOrdenCompra: true
              }
            }
          }
        },
        detalleCotizacion: {
          include: {
            materiaPrima: {
              include: {
                estadoMateriaPrima: true
              }
            }
          }
        }
      },
      orderBy: {
        facturaProveedor: {
          fechaEmision: 'asc'
        }
      }
    })

    if (!detallesFactura.length) {
      return NextResponse.json(
        { message: 'No se encontraron compras para los filtros seleccionados' },
        { status: 200 }
      )
    }

    // Procesar y agrupar datos por producto (y proveedor si se requiere)
    const resultado = {}

    detallesFactura.forEach(detalle => {
      const materiaPrima = detalle.detalleCotizacion.materiaPrima
      const factura = detalle.facturaProveedor
      const proveedor = factura.proveedor.empresa.razonSocial

      const clave = agruparPorProveedor 
        ? `${materiaPrima.idMateriaPrima}-${proveedor}`
        : materiaPrima.idMateriaPrima.toString()

      if (!resultado[clave]) {
        resultado[clave] = {
          producto: {
            id: materiaPrima.idMateriaPrima,
            nombre: materiaPrima.nombreMateriaPrima,
            estado: materiaPrima.estadoMateriaPrima.descEstadoMateriaPrima
          },
          proveedor: agruparPorProveedor ? proveedor : null,
          estadisticas: {
            comprasTotales: 0,
            cantidadTotal: 0,
            montoTotal: 0,
            // Se agregarán nuevos campos: promedioPorDia, compraMaxima, compraMinima y diasConCompras
            promedioPorDia: 0,
            compraMaxima: 0,
            compraMinima: 0,
            diasConCompras: 0
          },
          detalle: []
        }
      }

      // Actualizar estadísticas globales
      resultado[clave].estadisticas.comprasTotales += 1
      resultado[clave].estadisticas.cantidadTotal += Number(detalle.cantidadFacturada)
      resultado[clave].estadisticas.montoTotal += Number(detalle.subtotalFinal)

      // Agregar detalle (se asume que "fecha" viene de factura.fechaEmision)
      resultado[clave].detalle.push({
        idDetalle: detalle.idDetalleFactura,
        fecha: factura.fechaEmision, // se usará para agrupar por día
        nroFactura: factura.nroFactura,
        proveedor: proveedor,
        cantidad: Number(detalle.cantidadFacturada),
        precioUnitario: Number(detalle.precioUnitarioFinal),
        subtotal: Number(detalle.subtotalFinal)
      })
    })

    // Calcular estadísticas diarias para cada grupo
    Object.keys(resultado).forEach(clave => {
      const item = resultado[clave]
      // Agrupar totales diarios según la fecha (YYYY-MM-DD)
      const dailyTotals = {}
      item.detalle.forEach(det => {
        const day = new Date(det.fecha).toISOString().split('T')[0]
        dailyTotals[day] = (dailyTotals[day] || 0) + Number(det.subtotal)
      })
      const dailyValues = Object.values(dailyTotals)
      if (dailyValues.length > 0) {
        const totalDaily = dailyValues.reduce((sum, value) => sum + value, 0)
        item.estadisticas.promedioPorDia = totalDaily / dailyValues.length
        item.estadisticas.compraMaxima = Math.max(...dailyValues)
        item.estadisticas.compraMinima = Math.min(...dailyValues)
        item.estadisticas.diasConCompras = dailyValues.length
      }
    })

    // Convertir a array y ordenar por montoTotal descendente
    const responseData = Object.values(resultado).sort((a, b) => 
      b.estadisticas.montoTotal - a.estadisticas.montoTotal
    )

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Error en reporte compras por producto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
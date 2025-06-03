import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')
    const idMateriaPrima = searchParams.get('idMateriaPrima')
    const idEstado = searchParams.get('idEstado')
    const agruparPorProveedor = searchParams.get('agruparPorProveedor') === 'true'

    // Validar parámetros requeridos
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: 'Los parámetros fechaDesde y fechaHasta son obligatorios' },
        { status: 400 }
      )
    }

    // Construir condiciones de filtrado
    const whereCondition = {
      facturaProveedor: {
        fechaEmision: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta)
        }
      }
    }

    // Agregar filtros opcionales
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

    // Si no hay resultados
    if (!detallesFactura.length) {
      return NextResponse.json(
        { message: 'No se encontraron compras para los filtros seleccionados' },
        { status: 200 }
      )
    }

    // Procesar y agrupar datos
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
            precioPromedio: 0
          },
          detalle: []
        }
      }

      // Actualizar estadísticas
      resultado[clave].estadisticas.comprasTotales += 1
      resultado[clave].estadisticas.cantidadTotal += detalle.cantidadFacturada
      resultado[clave].estadisticas.montoTotal += detalle.subtotalFinal

      // Agregar detalle
      resultado[clave].detalle.push({
        idDetalle: detalle.idDetalleFactura,
        fecha: factura.fechaEmision,
        nroFactura: factura.nroFactura,
        proveedor: proveedor,
        cantidad: detalle.cantidadFacturada,
        precioUnitario: detalle.precioUnitarioFinal,
        subtotal: detalle.subtotalFinal
      })
    })

    // Calcular promedios
    Object.keys(resultado).forEach(clave => {
      const item = resultado[clave]
      // Evitar división por cero
      if (item.estadisticas.cantidadTotal > 0) {
        item.estadisticas.precioPromedio = item.estadisticas.montoTotal / item.estadisticas.cantidadTotal
      } else {
        item.estadisticas.precioPromedio = 0
      }
    })

    // Convertir a array y ordenar
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
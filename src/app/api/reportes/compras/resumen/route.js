import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

// GET - Obtener resumen general de compras
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get("periodo") || "mes" // mes, trimestre, año
    const año = searchParams.get("año") || new Date().getFullYear()

    console.log(`API: Generando resumen de compras para período: ${periodo}, año: ${año}`)

    // Calcular fechas según el período
    let fechaInicio, fechaFin
    const añoNum = Number(año)

    switch (periodo) {
      case "año":
        fechaInicio = new Date(añoNum, 0, 1)
        fechaFin = new Date(añoNum, 11, 31, 23, 59, 59)
        break
      case "trimestre":
        const trimestre = Number(searchParams.get("trimestre")) || 1
        const mesInicio = (trimestre - 1) * 3
        fechaInicio = new Date(añoNum, mesInicio, 1)
        fechaFin = new Date(añoNum, mesInicio + 2, 31, 23, 59, 59)
        break
      default: // mes
        const mes = Number(searchParams.get("mes")) || new Date().getMonth()
        fechaInicio = new Date(añoNum, mes, 1)
        fechaFin = new Date(añoNum, mes + 1, 0, 23, 59, 59)
    }

    // Obtener compras del período
    const compras = await prisma.facturaProveedor.findMany({
      where: {
        deletedAt: null,
        fechaEmision: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        proveedor: {
          include: {
            empresa: {
              select: {
                razonSocial: true,
              },
            },
          },
        },
        estadoFacturaProv: true,
        detallesFacturaProveedor: {
          include: {
            detalleCotizacion: {
              include: {
                materiaPrima: {
                  select: {
                    nombreMateriaPrima: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Calcular estadísticas generales
    const estadisticasGenerales = {
      totalCompras: compras.length,
      montoTotalPeriodo: compras.reduce((sum, c) => sum + c.montoTotalFactura, 0),
      comprasContado: compras.filter((c) => c.esContado).length,
      comprasCredito: compras.filter((c) => !c.esContado).length,
      montoContado: compras.filter((c) => c.esContado).reduce((sum, c) => sum + c.montoTotalFactura, 0),
      montoCredito: compras.filter((c) => !c.esContado).reduce((sum, c) => sum + c.montoTotalFactura, 0),
      promedioCompra:
        compras.length > 0 ? compras.reduce((sum, c) => sum + c.montoTotalFactura, 0) / compras.length : 0,
    }

    // Top 5 proveedores por monto
    const proveedoresPorMonto = {}
    compras.forEach((compra) => {
      const proveedor = compra.proveedor.empresa.razonSocial
      if (!proveedoresPorMonto[proveedor]) {
        proveedoresPorMonto[proveedor] = {
          nombre: proveedor,
          totalCompras: 0,
          montoTotal: 0,
        }
      }
      proveedoresPorMonto[proveedor].totalCompras++
      proveedoresPorMonto[proveedor].montoTotal += compra.montoTotalFactura
    })

    const topProveedores = Object.values(proveedoresPorMonto)
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 5)

    // Top 5 productos más comprados
    const productosPorCantidad = {}
    compras.forEach((compra) => {
      compra.detallesFacturaProveedor.forEach((detalle) => {
        const producto = detalle.detalleCotizacion.materiaPrima.nombreMateriaPrima
        if (!productosPorCantidad[producto]) {
          productosPorCantidad[producto] = {
            nombre: producto,
            cantidadTotal: 0,
            montoTotal: 0,
          }
        }
        productosPorCantidad[producto].cantidadTotal += detalle.cantidadFacturada
        productosPorCantidad[producto].montoTotal += detalle.subtotalFinal
      })
    })

    const topProductos = Object.values(productosPorCantidad)
      .sort((a, b) => b.cantidadTotal - a.cantidadTotal)
      .slice(0, 5)

    // Compras por estado
    const comprasPorEstado = {}
    compras.forEach((compra) => {
      const estado = compra.estadoFacturaProv.descEstadoFacturaProv
      if (!comprasPorEstado[estado]) {
        comprasPorEstado[estado] = {
          estado,
          cantidad: 0,
          monto: 0,
        }
      }
      comprasPorEstado[estado].cantidad++
      comprasPorEstado[estado].monto += compra.montoTotalFactura
    })

    console.log(`API: Resumen generado para ${compras.length} compras`)

    return NextResponse.json(
      {
        periodo: {
          tipo: periodo,
          año: añoNum,
          fechaInicio,
          fechaFin,
        },
        estadisticasGenerales,
        topProveedores,
        topProductos,
        comprasPorEstado: Object.values(comprasPorEstado),
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al generar resumen de compras:", error)
    return NextResponse.json(
      {
        error: "Error al generar resumen de compras",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const idProducto = searchParams.get("idProducto")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")
    const tipo = searchParams.get("tipo") || "detallado"

    console.log("Parámetros recibidos:", { idProducto, fechaDesde, fechaHasta, tipo })

    if (!idProducto || !fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Convertir fechas
    const fechaDesdeObj = new Date(fechaDesde + "T00:00:00.000Z")
    const fechaHastaObj = new Date(fechaHasta + "T23:59:59.999Z")

    if (tipo === "detallado") {
      // Consulta para datos detallados
      const ventasDetalladas = await prisma.pedidoDetalle.findMany({
        where: {
          idProducto: Number.parseInt(idProducto),
          pedidoCliente: {
            idEstadoPedido: 5, // Estado completado
            deletedAt: null,
            fechaPedido: {
              gte: fechaDesdeObj,
              lte: fechaHastaObj,
            },
          },
        },
        include: {
          producto: true,
          pedidoCliente: true,
        },
        orderBy: {
          pedidoCliente: {
            fechaPedido: "asc",
          },
        },
      })

      // Formatear datos para el frontend
      const datosFormateados = ventasDetalladas.map((detalle) => ({
        NOMBRE_PRODUCTO: detalle.producto.nombreProducto,
        DESCRIPCION: detalle.producto.descripcion,
        SUBTOTAL: detalle.subtotal,
        FECHA_VENTA: detalle.pedidoCliente.fechaPedido.toISOString().split("T")[0],
        CANTIDAD: detalle.cantidad,
        PRECIO_UNITARIO: detalle.precioUnitario,
      }))

      console.log(`Encontradas ${datosFormateados.length} ventas detalladas`)
      return NextResponse.json(datosFormateados)
    } else if (tipo === "agrupado") {
      // Consulta para datos agrupados (suma por fecha)
      const ventasAgrupadas = await prisma.pedidoDetalle.groupBy({
        by: ["idProducto"],
        where: {
          idProducto: Number.parseInt(idProducto),
          pedidoCliente: {
            idEstadoPedido: 5,
            deletedAt: null,
            fechaPedido: {
              gte: fechaDesdeObj,
              lte: fechaHastaObj,
            },
          },
        },
        _sum: {
          subtotal: true,
        },
      })

      // Obtener datos detallados para agrupar por fecha
      const ventasDetalladas = await prisma.pedidoDetalle.findMany({
        where: {
          idProducto: Number.parseInt(idProducto),
          pedidoCliente: {
            idEstadoPedido: 5,
            deletedAt: null,
            fechaPedido: {
              gte: fechaDesdeObj,
              lte: fechaHastaObj,
            },
          },
        },
        include: {
          producto: true,
          pedidoCliente: true,
        },
      })

      // Agrupar por fecha manualmente
      const ventasPorFecha = {}
      ventasDetalladas.forEach((detalle) => {
        const fecha = detalle.pedidoCliente.fechaPedido.toISOString().split("T")[0]
        if (!ventasPorFecha[fecha]) {
          ventasPorFecha[fecha] = {
            fecha: fecha,
            nombreProducto: detalle.producto.nombreProducto,
            totalVenta: 0,
          }
        }
        ventasPorFecha[fecha].totalVenta += detalle.subtotal
      })

      const datosAgrupados = Object.values(ventasPorFecha)

      console.log(`Encontrados ${datosAgrupados.length} registros agrupados`)
      return NextResponse.json(datosAgrupados)
    }

    return NextResponse.json({ error: "Tipo de consulta no válido" }, { status: 400 })
  } catch (error) {
    console.error("Error en reporte de ventas por producto:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

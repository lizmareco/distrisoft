import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { success: false, error: "Debe especificar los parámetros 'fechaDesde' y 'fechaHasta'." },
        { status: 400 }
      )
    }

    // Buscar todos los pedidos completados en el rango, incluyendo cliente y persona
    const pedidos = await prisma.pedidoCliente.findMany({
      where: {
        idEstadoPedido: 5,
        deletedAt: null,
        fechaPedido: {
          gte: new Date(fechaDesde + "T00:00:00.000Z"),
          lte: new Date(fechaHasta + "T23:59:59.999Z"),
        },
      },
      include: {
        cliente: {
          include: {
            persona: true,
          },
        },
      },
    })

    // Agrupar en JS por idCliente
    const agrupado = {}
    for (const pedido of pedidos) {
      const id = pedido.idCliente
      if (!agrupado[id]) {
        agrupado[id] = {
          id_cliente: id,
          NOMBRE: pedido.cliente?.persona?.nombre || "",
          APELLIDO: pedido.cliente?.persona?.apellido || "",
          total_venta: 0,
        }
      }
      agrupado[id].total_venta += Number(pedido.montoTotal) || 0
    }

    // Convertir a array y ordenar
    const resultado = Object.values(agrupado).sort((a, b) => b.total_venta - a.total_venta)

    return NextResponse.json({ success: true, data: resultado })
  } catch (error) {
    console.error("Error en reporte de clientes con más ventas:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
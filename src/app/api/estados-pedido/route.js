import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/estados-pedido - Obtener todos los estados de pedido
export async function GET() {
  try {
    console.log("API: Obteniendo estados de pedido...")
    const estadosPedido = await prisma.estadoPedido.findMany({
      orderBy: {
        descEstadoPedido: "asc", // Ordenar por descripción
      },
    })

    // Imprimir los estados para depuración
    console.log("Estados de pedido encontrados:", estadosPedido)

    console.log(`API: Se encontraron ${estadosPedido.length} estados de pedido`)
    return NextResponse.json({ estadosPedido })
  } catch (error) {
    console.error("API: Error al obtener estados de pedido:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

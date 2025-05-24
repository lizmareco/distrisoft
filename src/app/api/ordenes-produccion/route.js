import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const ordenes = await prisma.ordenProduccion.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        pedidoCliente: {
          select: {
            idPedido: true,
          },
        },
        usuario: {
          include: {
            persona: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        estadoOrdenProd: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(ordenes)
  } catch (error) {
    console.error("Error al obtener órdenes de producción:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET() {
  try {
    console.log("Obteniendo todos los clientes...")

    // Obtener todos los clientes activos con sus relaciones
    const clientes = await prisma.cliente.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        persona: {
          include: {
            tipoDocumento: true,
          },
        },
        sectorCliente: true,
        empresa: true,
      },
      orderBy: {
        idCliente: "desc", // Ordenar por ID descendente (más recientes primero)
      },
      take: 100, // Limitar a 100 resultados para evitar sobrecarga
    })

    console.log(`Se encontraron ${clientes.length} clientes`)
    return NextResponse.json(clientes, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener todos los clientes:", error)
    return NextResponse.json(
      { error: "Error al obtener todos los clientes" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

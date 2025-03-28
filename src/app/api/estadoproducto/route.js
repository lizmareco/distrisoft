import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const estadosProducto = await prisma.estadoProducto.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        idEstadoProducto: true,
        descEstadoProducto: true,
      },
    })

    // Mapear los resultados para mantener compatibilidad con el frontend
    const estadosFormateados = estadosProducto.map((estado) => ({
      idEstadoProducto: estado.idEstadoProducto,
      nombreEstadoProducto: estado.descEstadoProducto, // Mapear descEstadoProducto a nombreEstadoProducto
    }))

    return NextResponse.json(estadosFormateados)
  } catch (error) {
    console.error("Error al obtener estados de producto:", error)
    return NextResponse.json({ error: "Error al obtener estados de producto: " + error.message }, { status: 500 })
  }
}


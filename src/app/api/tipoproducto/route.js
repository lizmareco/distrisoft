import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const tiposProducto = await prisma.tipoProducto.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        idTipoProducto: true,
        descTipoProducto: true,
      },
    })

    // Mapear los resultados para mantener compatibilidad con el frontend
    const tiposFormateados = tiposProducto.map((tipo) => ({
      idTipoProducto: tipo.idTipoProducto,
      nombreTipoProducto: tipo.descTipoProducto, // Mapear descTipoProducto a nombreTipoProducto
    }))

    return NextResponse.json(tiposFormateados)
  } catch (error) {
    console.error("Error al obtener tipos de producto:", error)
    return NextResponse.json({ error: "Error al obtener tipos de producto: " + error.message }, { status: 500 })
  }
}


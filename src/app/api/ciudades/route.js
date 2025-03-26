import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("API ciudades: Solicitud GET recibida")

    // Obtener todas las ciudades
    const ciudades = await prisma.ciudad.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        nombre: "asc",
      },
    })

    console.log(`API ciudades: Se encontraron ${ciudades.length} ciudades`)
    return NextResponse.json({ ciudades })
  } catch (error) {
    console.error("Error al obtener ciudades:", error)
    return NextResponse.json({ message: "Error al obtener ciudades", error: error.message }, { status: 500 })
  }
}


import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("API tipos-persona: Solicitud GET recibida")

    // Obtener todos los tipos de persona
    const tiposPersona = await prisma.tipoPersona.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        nombre: "asc",
      },
    })

    console.log(`API tipos-persona: Se encontraron ${tiposPersona.length} tipos de persona`)
    return NextResponse.json({ tiposPersona })
  } catch (error) {
    console.error("Error al obtener tipos de persona:", error)
    return NextResponse.json({ message: "Error al obtener tipos de persona", error: error.message }, { status: 500 })
  }
}


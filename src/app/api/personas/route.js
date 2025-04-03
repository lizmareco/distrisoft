import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/personas - Obtener todas las personas
export async function GET() {
  try {
    console.log("API: Consultando personas en la base de datos")
    const personas = await prisma.persona.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        apellido: "asc",
      },
    })
    console.log("API: Personas encontradas:", personas.length)
    return NextResponse.json({ personas }, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener personas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


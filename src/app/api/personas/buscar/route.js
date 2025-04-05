import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/personas/buscar?termino=xxx - Buscar personas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const termino = searchParams.get("termino") || ""

    console.log("API: Buscando personas con término:", termino)

    let personas
    if (!termino || termino.trim() === "") {
      personas = await prisma.persona.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          apellido: "asc",
        },
      })
    } else {
      personas = await prisma.persona.findMany({
        where: {
          OR: [
            { nombre: { contains: termino, mode: "insensitive" } },
            { apellido: { contains: termino, mode: "insensitive" } },
            { nroDocumento: { contains: termino } },
          ],
          deletedAt: null,
        },
        orderBy: {
          apellido: "asc",
        },
      })
    }

    console.log("API: Personas encontradas:", personas.length)
    // Devolver directamente el array de personas, no un objeto con propiedad personas
    return NextResponse.json(personas, { status: 200 })
  } catch (error) {
    console.error("API: Error al buscar personas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET /api/personas/buscar?termino=xxx - Buscar personas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const termino = searchParams.get("termino") || ""

    console.log("API: Buscando personas con término:", termino)

    let personas = []
    if (!termino || termino.trim() === "") {
      // Devolver array vacío si no hay término
      return NextResponse.json(personas, { status: 200 })
    }

    // Verificar si el término parece ser un número de documento (solo dígitos)
    const esNumeroDocumento = /^\d+$/.test(termino)

    if (esNumeroDocumento) {
      // Buscar coincidencia exacta por número de documento
      const persona = await prisma.persona.findFirst({
        where: {
          nroDocumento: { equals: termino }, // Usar equals en lugar de contains para coincidencia exacta
          deletedAt: null,
        },
        include: {
          ciudad: true,
          tipoDocumento: true,
        },
      })

      // Si se encontró una persona, agregarla al array de resultados
      if (persona) {
        personas = [persona]
      }
    }

    console.log("API: Personas encontradas:", personas.length)
    // Devolver directamente el array de personas (vacío o con un solo elemento)
    return NextResponse.json(personas, { status: 200 })
  } catch (error) {
    console.error("API: Error al buscar personas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

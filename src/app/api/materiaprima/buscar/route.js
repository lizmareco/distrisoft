import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""

    if (!query.trim()) {
      return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
    }

    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nombreMateriaPrima: { contains: query, mode: "insensitive" } },
          { descMateriaPrima: { contains: query, mode: "insensitive" } }, // Corregido: descMateriaPrima en lugar de descripcion
        ],
      },
      include: {
        estadoMateriaPrima: true, // Incluir el estado de la materia prima
      },
    })

    console.log(`API: Se encontraron ${materiasPrimas.length} materias primas para la búsqueda "${query}"`)
    return NextResponse.json(materiasPrimas, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar materias primas:", error)
    return NextResponse.json(
      { message: "Error al buscar materias primas", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

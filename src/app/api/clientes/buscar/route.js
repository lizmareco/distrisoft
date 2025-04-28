import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    console.log("API: Buscando clientes con query:", query)

    if (!query || query.trim() === "") {
      return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
    }

    // Buscar clientes por nombre, apellido o número de documento
    const clientes = await prisma.cliente.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            persona: {
              nombre: {
                contains: query,
                mode: "insensitive",
              },
              deletedAt: null,
            },
          },
          {
            persona: {
              apellido: {
                contains: query,
                mode: "insensitive",
              },
              deletedAt: null,
            },
          },
          {
            persona: {
              nroDocumento: {
                contains: query,
                mode: "insensitive",
              },
              deletedAt: null,
            },
          },
          {
            empresa: {
              razonSocial: {
                contains: query,
                mode: "insensitive",
              },
              deletedAt: null,
            },
          },
        ],
      },
      include: {
        persona: {
          include: {
            tipoDocumento: true,
          },
        },
        empresa: true,
        sectorCliente: true,
      },
      orderBy: [
        {
          persona: {
            apellido: "asc",
          },
        },
        {
          persona: {
            nombre: "asc",
          },
        },
      ],
      take: 10, // Limitar a 10 resultados
    })

    console.log(`API: Se encontraron ${clientes.length} clientes con la query "${query}"`)
    return NextResponse.json(clientes, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar clientes:", error)
    return NextResponse.json(
      { message: "Error al buscar clientes", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

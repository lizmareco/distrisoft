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

    const proveedores = await prisma.proveedor.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            empresa: {
              razonSocial: { contains: query, mode: "insensitive" },
            },
          },
          {
            empresa: {
              contacto: { contains: query, mode: "insensitive" },
            },
          },
          {
            empresa: {
              ruc: { contains: query, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        empresa: true,
      },
    })

    console.log(`API: Se encontraron ${proveedores.length} proveedores para la búsqueda "${query}"`)
    return NextResponse.json(proveedores, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar proveedores:", error)
    return NextResponse.json(
      { message: "Error al buscar proveedores", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    console.log("API: Buscando productos con query:", query)

    if (!query || query.trim() === "") {
      return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
    }

    // Buscar productos por nombre o descripción
    const productos = await prisma.producto.findMany({
      where: {
        deletedAt: null,
        idEstadoProducto: 1, // Solo productos activos
        OR: [
          {
            nombreProducto: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            descripcion: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        unidadMedida: true,
        tipoProducto: true,
      },
      orderBy: {
        nombreProducto: "asc",
      },
      take: 10, // Limitar a 10 resultados
    })

    console.log(`API: Se encontraron ${productos.length} productos con la query "${query}"`)
    return NextResponse.json(productos, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar productos:", error)
    return NextResponse.json(
      { message: "Error al buscar productos", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

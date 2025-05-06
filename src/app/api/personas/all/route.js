import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    console.log("API: Obteniendo personas activas con paginación...")

    // Obtener parámetros de paginación de la URL
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "100", 10)

    // Validar parámetros de paginación
    const validPage = page > 0 ? page : 1
    const validPageSize = pageSize > 0 && pageSize <= 100 ? pageSize : 100

    // Calcular el offset para la paginación
    const skip = (validPage - 1) * validPageSize

    console.log(`API: Parámetros de paginación - Página: ${validPage}, Tamaño: ${validPageSize}, Skip: ${skip}`)

    // Obtener el total de registros para calcular el total de páginas
    const totalPersonas = await prisma.persona.count({
      where: {
        deletedAt: null,
      },
    })

    // Obtener las personas para la página actual
    const personas = await prisma.persona.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        tipoDocumento: true,
        ciudad: true,
      },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      skip: skip,
      take: validPageSize,
    })

    console.log(`API: Se encontraron ${personas.length} personas para la página ${validPage} (total: ${totalPersonas})`)

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalPersonas / validPageSize)

    // Devolver los datos con metadatos de paginación
    return NextResponse.json(
      {
        personas: personas || [], // Asegurar que siempre sea un array
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          totalItems: totalPersonas,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        },
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al obtener personas:", error)
    // En caso de error, devolver una estructura consistente con arrays vacíos
    return NextResponse.json(
      {
        personas: [],
        pagination: {
          page: 1,
          pageSize: 100,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        error: "Error al obtener personas",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

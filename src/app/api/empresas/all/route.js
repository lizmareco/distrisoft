import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    console.log("API: Obteniendo empresas activas con paginación...")

    // Obtener parámetros de paginación de la URL
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "50", 10)

    // Validar parámetros de paginación
    const validPage = page > 0 ? page : 1
    const validPageSize = pageSize > 0 && pageSize <= 100 ? pageSize : 50

    // Calcular el offset para la paginación
    const skip = (validPage - 1) * validPageSize

    console.log(`API: Parámetros de paginación - Página: ${validPage}, Tamaño: ${validPageSize}, Skip: ${skip}`)

    // Obtener el total de registros para calcular el total de páginas
    const totalEmpresas = await prisma.empresa.count({
      where: {
        deletedAt: null,
      },
    })

    // Obtener las empresas para la página actual
    const empresas = await prisma.empresa.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
      },
      orderBy: [{ razonSocial: "asc" }],
      skip: skip,
      take: validPageSize,
    })

    console.log(`API: Se encontraron ${empresas.length} empresas para la página ${validPage} (total: ${totalEmpresas})`)

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalEmpresas / validPageSize)

    // Devolver los datos con metadatos de paginación
    return NextResponse.json(
      {
        empresas: empresas || [], // Asegurar que siempre sea un array
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          totalItems: totalEmpresas,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        },
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al obtener empresas:", error)
    // En caso de error, devolver una estructura consistente con arrays vacíos
    return NextResponse.json(
      {
        empresas: [],
        pagination: {
          page: 1,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        error: "Error al obtener empresas",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

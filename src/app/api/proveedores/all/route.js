import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    console.log("API: Obteniendo todos los proveedores con paginación...")

    // Obtener parámetros de paginación de la URL
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10)

    // Validar parámetros de paginación
    const validPage = page > 0 ? page : 1
    const validPageSize = pageSize > 0 && pageSize <= 100 ? pageSize : 10

    // Calcular el offset para la paginación
    const skip = (validPage - 1) * validPageSize

    console.log(`API: Parámetros de paginación - Página: ${validPage}, Tamaño: ${validPageSize}, Skip: ${skip}`)

    // Obtener el total de registros para calcular el total de páginas
    const totalProveedores = await prisma.proveedor.count({
      where: {
        deletedAt: null,
      },
    })

    // Obtener los proveedores para la página actual
    const proveedores = await prisma.proveedor.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        empresa: {
          include: {
            tipoDocumento: true,
            categoriaEmpresa: true,
            ciudad: true,
          },
        },
      },
      orderBy: {
        idProveedor: "desc",
      },
      skip: skip,
      take: validPageSize,
    })

    console.log(`API: Se encontraron ${proveedores.length} proveedores para la página ${validPage} (total: ${totalProveedores})`)

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalProveedores / validPageSize)

    // Devolver los datos con metadatos de paginación
    return NextResponse.json(
      {
        proveedores: proveedores || [], // Asegurar que siempre sea un array
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          totalItems: totalProveedores,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        },
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al obtener todos los proveedores:", error)
    // En caso de error, devolver una estructura consistente con arrays vacíos
    return NextResponse.json(
      {
        proveedores: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        error: "Error al obtener proveedores",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

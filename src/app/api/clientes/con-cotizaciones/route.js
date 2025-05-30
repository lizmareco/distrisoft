import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

// GET - Obtener clientes que tienen al menos una cotización
export async function GET(request) {
  try {
    console.log("API: Obteniendo clientes con cotizaciones...")

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Construir condiciones de búsqueda
    const whereCondition = {
      deletedAt: null,
      cotizacionCliente: {
        some: {
          deletedAt: null, // Solo cotizaciones no eliminadas
        },
      },
    }

    // Si hay término de búsqueda, agregar filtros
    if (search.trim()) {
      whereCondition.OR = [
        // Búsqueda por nombre y apellido de persona
        {
          persona: {
            OR: [
              { nombre: { contains: search, mode: "insensitive" } },
              { apellido: { contains: search, mode: "insensitive" } },
              { nroDocumento: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        // Búsqueda por razón social de empresa (si tiene)
        {
          empresa: {
            razonSocial: { contains: search, mode: "insensitive" },
          },
        },
      ]
    }

    const clientes = await prisma.cliente.findMany({
      where: whereCondition,
      include: {
        persona: {
          include: {
            tipoDocumento: true,
          },
        },
        empresa: true,
        _count: {
          select: {
            cotizacionCliente: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [
        {
          persona: {
            nombre: "asc",
          },
        },
        {
          persona: {
            apellido: "asc",
          },
        },
      ],
      take: 50, // Limitar resultados
    })

    console.log(`API: Se encontraron ${clientes.length} clientes con cotizaciones`)
    return NextResponse.json(clientes, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener clientes con cotizaciones:", error)
    return NextResponse.json(
      { message: "Error al obtener clientes", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

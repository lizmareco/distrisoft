import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const ruc = searchParams.get("ruc")
    const razonSocial = searchParams.get("razonSocial")

    console.log("Buscando empresas disponibles con parámetros:", { ruc, razonSocial })

    // Construir la condición de búsqueda base
    const whereCondition = {
      deletedAt: null,
      // Excluir empresas que ya son clientes
      NOT: {
        cliente: {
          some: {
            deletedAt: null,
          },
        },
      },
    }

    // Agregar condiciones de búsqueda según los parámetros proporcionados
    if (ruc && razonSocial) {
      // Buscar por ambos criterios
      whereCondition.AND = [
        {
          ruc: {
            contains: ruc,
            mode: "insensitive",
          },
        },
        {
          razonSocial: {
            contains: razonSocial,
            mode: "insensitive",
          },
        },
      ]
    } else if (ruc) {
      // Buscar solo por RUC
      whereCondition.ruc = {
        contains: ruc,
        mode: "insensitive",
      }
    } else if (razonSocial) {
      // Buscar solo por razón social
      whereCondition.razonSocial = {
        contains: razonSocial,
        mode: "insensitive",
      }
    }

    // Obtener todas las empresas que NO son clientes y cumplen con los criterios de búsqueda
    const empresas = await prisma.empresa.findMany({
      where: whereCondition,
      include: {
        tipoDocumento: true,
        ciudad: true,
        categoriaEmpresa: true,
      },
      orderBy: {
        razonSocial: "asc",
      },
    })

    console.log(`Se encontraron ${empresas.length} empresas disponibles con los criterios de búsqueda`)
    return NextResponse.json(empresas, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener empresas disponibles:", error)
    return NextResponse.json(
      { error: "Error al obtener empresas disponibles" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

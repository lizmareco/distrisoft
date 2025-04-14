import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const tipoDocumento = searchParams.get("tipoDocumento")
    const numeroDocumento = searchParams.get("numeroDocumento")

    console.log("Buscando empresas disponibles con parámetros:", { tipoDocumento, numeroDocumento })

    // Construir la condición de búsqueda
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

    // Si se proporcionan parámetros de búsqueda, añadirlos a la condición
    if (tipoDocumento && numeroDocumento) {
      whereCondition.idTipoDocumento = Number(tipoDocumento)
      whereCondition.ruc = {
        contains: numeroDocumento,
        mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
      }
    }

    // Obtener todas las empresas que NO son clientes y cumplen con los criterios de búsqueda
    const empresas = await prisma.empresa.findMany({
      where: whereCondition,
      include: {
        tipoDocumento: true,
        ciudad: true,
        persona: true,
        categoriaEmpresa: true,
      },
      orderBy: {
        razonSocial: "asc",
      },
    })

    console.log(`Se encontraron ${empresas.length} empresas disponibles`)
    return NextResponse.json(empresas, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener empresas disponibles:", error)
    return NextResponse.json(
      { error: "Error al obtener empresas disponibles" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    console.log("Obteniendo personas disponibles (no clientes)...")

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const tipoDocumento = searchParams.get("tipoDocumento")
    const numeroDocumento = searchParams.get("numeroDocumento")

    console.log("Buscando personas con parámetros:", { tipoDocumento, numeroDocumento })

    // Construir la consulta base
    const whereClause = {
      deletedAt: null,
      // Excluir personas que ya son clientes
      NOT: {
        cliente: {
          some: {
            deletedAt: null,
          },
        },
      },
    }

    // Añadir filtros de búsqueda si se proporcionan
    if (tipoDocumento && numeroDocumento) {
      whereClause.idTipoDocumento = Number(tipoDocumento)
      whereClause.nroDocumento = {
        contains: numeroDocumento,
        mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
      }
    }

    // Obtener todas las personas que NO son clientes y cumplen con los criterios de búsqueda
    const personas = await prisma.persona.findMany({
      where: whereClause,
      include: {
        tipoDocumento: true,
        ciudad: true,
      },
      orderBy: {
        apellido: "asc",
      },
    })

    console.log(`Se encontraron ${personas.length} personas disponibles`)
    return NextResponse.json(personas)
  } catch (error) {
    console.error("Error al obtener personas disponibles:", error)
    return NextResponse.json({ error: "Error al obtener personas disponibles" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parámetros de paginación
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Parámetros de filtros
    const idOrden = searchParams.get("idOrden")
    const idPedido = searchParams.get("idPedido")
    const estado = searchParams.get("estado")
    const operador = searchParams.get("operador")
    const search = searchParams.get("search")

    // Construir condiciones WHERE
    const where = {
      deletedAt: null,
    }

    if (idOrden) {
      where.idOrdenProduccion = Number.parseInt(idOrden)
    }

    if (idPedido) {
      where.pedidoCliente = {
        idPedido: Number.parseInt(idPedido),
      }
    }

    if (estado) {
      where.idEstadoOrdenProd = Number.parseInt(estado)
    }

    if (operador) {
      where.operadorEncargado = Number.parseInt(operador)
    }

    // Búsqueda general (en múltiples campos)
    if (search) {
      const searchTerm = search.toLowerCase()
      where.OR = [
        {
          idOrdenProduccion: {
            equals: isNaN(Number.parseInt(search)) ? undefined : Number.parseInt(search),
          },
        },
        {
          pedidoCliente: {
            idPedido: {
              equals: isNaN(Number.parseInt(search)) ? undefined : Number.parseInt(search),
            },
          },
        },
        {
          usuario: {
            persona: {
              nombre: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          usuario: {
            persona: {
              apellido: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          usuario: {
            nombreUsuario: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      ].filter((condition) => {
        // Filtrar condiciones undefined
        return Object.values(condition)[0] !== undefined
      })
    }

    // Contar total de registros
    const total = await prisma.ordenProduccion.count({ where })

    // Obtener órdenes con paginación
    const ordenes = await prisma.ordenProduccion.findMany({
      where,
      include: {
        pedidoCliente: {
          select: {
            idPedido: true,
          },
        },
        usuario: {
          include: {
            persona: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        estadoOrdenProd: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      ordenes,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error al buscar órdenes de producción:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

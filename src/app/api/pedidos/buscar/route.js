import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    // Obtener parámetros de búsqueda
    const clienteId = searchParams.get("cliente")
    const estadoId = searchParams.get("estado")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    // Parámetros de paginación
    const pagina = Number.parseInt(searchParams.get("pagina")) || 1
    const limite = Number.parseInt(searchParams.get("limite")) || 50

    console.log("Parámetros de búsqueda recibidos:", {
      clienteId,
      estadoId,
      fechaDesde,
      fechaHasta,
      pagina,
      limite,
    })

    // Construir el objeto where dinámicamente
    const whereClause = {}

    // Filtro por cliente
    if (clienteId && clienteId !== "") {
      whereClause.idCliente = Number.parseInt(clienteId)
    }

    // Filtro por estado
    if (estadoId && estadoId !== "") {
      whereClause.idEstadoPedido = Number.parseInt(estadoId)
    }

    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      whereClause.fechaPedido = {}

      if (fechaDesde && fechaDesde !== "") {
        whereClause.fechaPedido.gte = new Date(fechaDesde)
      }

      if (fechaHasta && fechaHasta !== "") {
        // Agregar 23:59:59 para incluir todo el día
        const fechaHastaCompleta = new Date(fechaHasta)
        fechaHastaCompleta.setHours(23, 59, 59, 999)
        whereClause.fechaPedido.lte = fechaHastaCompleta
      }
    }

    console.log("Cláusula WHERE construida:", JSON.stringify(whereClause, null, 2))

    // Calcular offset para paginación
    const offset = (pagina - 1) * limite

    // Contar total de registros
    const totalRegistros = await prisma.pedidoCliente.count({
      where: whereClause,
    })

    // Realizar la consulta con paginación
    const pedidos = await prisma.pedidoCliente.findMany({
      where: whereClause,
      include: {
        cliente: {
          include: {
            persona: {
              include: {
                tipoDocumento: true,
              },
            },
            empresa: true,
          },
        },
        estadoPedido: true,
        pedidoDetalle: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: {
        fechaPedido: "desc", // Ordenar por fecha más reciente primero
      },
      skip: offset,
      take: limite,
    })

    // Calcular total de páginas
    const totalPaginas = Math.ceil(totalRegistros / limite)

    console.log(
      `Se encontraron ${pedidos.length} pedidos de ${totalRegistros} totales (página ${pagina} de ${totalPaginas})`,
    )

    // Devolver respuesta estructurada
    const respuesta = {
      pedidos: pedidos,
      totalRegistros: totalRegistros,
      totalPaginas: totalPaginas,
      paginaActual: pagina,
      registrosPorPagina: limite,
    }

    return NextResponse.json(respuesta)
  } catch (error) {
    console.error("Error al buscar pedidos:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor al buscar pedidos",
        detalles: error.message,
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

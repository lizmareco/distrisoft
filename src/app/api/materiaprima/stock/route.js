import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const auditoriaService = new AuditoriaService()

console.log("API MateriaPrima/stock: Endpoint cargado")

export async function GET(request) {
  try {
    console.log("API MateriaPrima/stock - Iniciando solicitud GET")

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const idEstado = searchParams.get("estado") || ""
    const loadAll = searchParams.get("loadAll") === "true"

    // Añadir logs para depuración
    console.log("API MateriaPrima/stock - Parámetros recibidos:", {
      query,
      idEstado,
      loadAll,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries()),
    })

    // Si no hay filtros y no se solicita cargar todo, devolver un array vacío
    if (!query && !idEstado && !loadAll) {
      console.log("API MateriaPrima/stock - No hay filtros y no se solicita cargar todo. Devolviendo array vacío.")
      return NextResponse.json([], { status: 200 })
    }

    // Construir condiciones de búsqueda
    const where = {
      deletedAt: null,
    }

    // Si hay término de búsqueda, añadir condición OR
    if (query.trim()) {
      where.OR = [
        { nombreMateriaPrima: { contains: query, mode: "insensitive" } },
        { descMateriaPrima: { contains: query, mode: "insensitive" } },
      ]
      console.log("API MateriaPrima/stock - Aplicando filtro de búsqueda:", query)
    }

    // Si se especifica un estado, filtrar por ese estado
    if (idEstado && !isNaN(Number.parseInt(idEstado))) {
      where.idEstadoMateriaPrima = Number.parseInt(idEstado)
      console.log(`API MateriaPrima/stock - Filtrando por estado ID: ${idEstado}`)
    }

    console.log("API MateriaPrima/stock - Condiciones de búsqueda finales:", JSON.stringify(where))

    // Buscar materias primas
    const materiasPrimas = await prisma.materiaPrima.findMany({
      where,
      include: {
        estadoMateriaPrima: true,
      },
      orderBy: {
        nombreMateriaPrima: "asc",
      },
    })

    console.log(`API MateriaPrima/stock - Se encontraron ${materiasPrimas.length} materias primas con stock`)

    // Log detallado para depuración
    if (materiasPrimas.length > 0) {
      console.log("API MateriaPrima/stock - Primera materia prima encontrada:", {
        id: materiasPrimas[0].idMateriaPrima,
        nombre: materiasPrimas[0].nombreMateriaPrima,
        descripcion: materiasPrimas[0].descMateriaPrima,
        estado: materiasPrimas[0].estadoMateriaPrima?.descEstadoMateriaPrima || "N/A",
        stock: materiasPrimas[0].stockActual,
      })
    } else {
      console.log("API MateriaPrima/stock - No se encontraron materias primas")
    }

    return NextResponse.json(materiasPrimas, { status: 200 })
  } catch (error) {
    console.error("API MateriaPrima/stock - Error:", error)
    return NextResponse.json(
      {
        message: "Error al obtener stock de materias primas",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// POST - Actualizar stock de una materia prima
export async function POST(request) {
  try {
    console.log("API MateriaPrima/stock - Iniciando solicitud POST")

    const data = await request.json()
    const { idMateriaPrima, cantidad, observacion } = data

    console.log("API MateriaPrima/stock - Datos recibidos:", data)

    if (!idMateriaPrima || cantidad === undefined) {
      return NextResponse.json({ error: "Se requiere idMateriaPrima y cantidad" }, { status: 400 })
    }

    // Verificar materia prima y su estado ANTES de la transacción
    const materiaPrimaVerificacion = await prisma.materiaPrima.findUnique({
      where: {
        idMateriaPrima,
        deletedAt: null,
      },
      include: {
        estadoMateriaPrima: true,
      },
    })

    if (!materiaPrimaVerificacion) {
      return NextResponse.json({ error: `Materia prima con ID ${idMateriaPrima} no encontrada` }, { status: 404 })
    }

    // Validar que la materia prima esté activa
    if (materiaPrimaVerificacion.estadoMateriaPrima?.descEstadoMateriaPrima !== "ACTIVO") {
      return NextResponse.json(
        {
          error: "No se puede modificar el stock",
          mensaje: `La materia prima debe estar en estado ACTIVO. Estado actual: ${materiaPrimaVerificacion.estadoMateriaPrima?.descEstadoMateriaPrima || "Desconocido"}`,
        },
        { status: 400 },
      )
    }

    // Iniciar transacción (ahora sin la validación de estado)
    const resultado = await prisma.$transaction(async (tx) => {
      // Obtener materia prima actual (ya sabemos que existe y está activa)
      const materiaPrima = await tx.materiaPrima.findUnique({
        where: {
          idMateriaPrima,
          deletedAt: null,
        },
        include: {
          estadoMateriaPrima: true,
        },
      })

      // Calcular nuevo stock
      const stockActual = Number.parseFloat(materiaPrima.stockActual || 0)
      const cantidadAjuste = Number.parseFloat(cantidad)
      const nuevoStock = stockActual + cantidadAjuste

      if (nuevoStock < 0) {
        throw new Error("El stock no puede ser negativo")
      }

      // Si no hay cambio real en el stock, no hacer nada
      if (stockActual === nuevoStock) {
        return {
          materiaPrimaActualizada: materiaPrima,
          movimiento: null,
          cambioRealizado: false,
        }
      }

      console.log(`API MateriaPrima/stock - Actualizando stock: ${stockActual} -> ${nuevoStock}`)

      // Actualizar stock de la materia prima
      const materiaPrimaActualizada = await tx.materiaPrima.update({
        where: { idMateriaPrima },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      // Registrar movimiento en inventario
      const movimiento = await tx.inventario.create({
        data: {
          idMateriaPrima,
          cantidad: cantidadAjuste,
          unidadMedida: "Unidad",
          fechaMovimiento: new Date(),
          tipoMovimiento: cantidadAjuste > 0 ? "ENTRADA" : "SALIDA",
          motivo: "Ajuste manual de stock",
          observacion: observacion || `Ajuste manual de stock: ${cantidadAjuste > 0 ? "Entrada" : "Salida"}`,
        },
      })

      return {
        materiaPrimaActualizada,
        movimiento,
        cambioRealizado: true,
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
      }
    })

    // Solo registrar auditoría si hubo un cambio real
    if (resultado.cambioRealizado) {
      await auditoriaService.registrarAuditoria({
        entidad: "MateriaPrima",
        idRegistro: idMateriaPrima,
        accion: "ACTUALIZAR_STOCK",
        valorAnterior: { stockActual: resultado.stockAnterior },
        valorNuevo: {
          stockActual: resultado.stockNuevo,
          ajuste: cantidad,
          observacion: observacion || "Ajuste manual",
        },
        idUsuario: 1,
        request,
      })

      console.log(`API MateriaPrima/stock - Stock actualizado correctamente para ID: ${idMateriaPrima}`)
    } else {
      console.log(`API MateriaPrima/stock - No hubo cambio real en el stock para ID: ${idMateriaPrima}`)
    }

    return NextResponse.json({
      mensaje: resultado.cambioRealizado ? "Stock actualizado correctamente" : "No hubo cambios en el stock",
      materiaPrima: resultado.materiaPrimaActualizada,
      movimiento: resultado.movimiento,
      cambioRealizado: resultado.cambioRealizado,
    })
  } catch (error) {
    console.error("API MateriaPrima/stock - Error:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar stock de materia prima",
        detalles: error.message,
      },
      { status: 500 },
    )
  }
}

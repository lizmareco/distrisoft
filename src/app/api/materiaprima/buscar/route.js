import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const auditoriaService = new AuditoriaService()

console.log("API MateriaPrima/buscar: Endpoint cargado")

export async function GET(request) {
  try {
    console.log("API MateriaPrima/buscar - Iniciando solicitud GET")

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const activas = searchParams.get("activas") === "true"

    // Añadir logs para depuración
    console.log("API MateriaPrima/buscar - Parámetros recibidos:", {
      query,
      activas,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries()),
    })

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
      console.log("API MateriaPrima/buscar - Aplicando filtro de búsqueda:", query)
    }

    // Si se especifica activas=true, filtrar por estado activo
    if (activas) {
      // Primero, buscar el ID del estado "ACTIVO"
      const estadoActivo = await prisma.estadoMateriaPrima.findFirst({
        where: {
          descEstadoMateriaPrima: { equals: "ACTIVO", mode: "insensitive" },
          deletedAt: null,
        },
      })

      if (estadoActivo) {
        where.idEstadoMateriaPrima = estadoActivo.idEstadoMateriaPrima
        console.log(`API MateriaPrima/buscar - Filtrando por estado ACTIVO (ID: ${estadoActivo.idEstadoMateriaPrima})`)
      } else {
        console.log("API MateriaPrima/buscar - No se encontró el estado ACTIVO")
      }
    }

    console.log("API MateriaPrima/buscar - Condiciones de búsqueda finales:", JSON.stringify(where))

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

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "MateriaPrima",
      idRegistro: "busqueda",
      accion: "CONSULTAR",
      valorAnterior: null,
      valorNuevo: { query, activas },
      idUsuario: userData.idUsuario,
    })

    console.log(`API MateriaPrima/buscar - Se encontraron ${materiasPrimas.length} materias primas`)

    // Log detallado para depuración
    if (materiasPrimas.length > 0) {
      console.log("API MateriaPrima/buscar - Primera materia prima encontrada:", {
        id: materiasPrimas[0].idMateriaPrima,
        nombre: materiasPrimas[0].nombreMateriaPrima,
        descripcion: materiasPrimas[0].descMateriaPrima,
        estado: materiasPrimas[0].estadoMateriaPrima?.descEstadoMateriaPrima || "N/A",
        stock: materiasPrimas[0].stockActual,
      })
    } else {
      console.log("API MateriaPrima/buscar - No se encontraron materias primas")
    }

    return NextResponse.json(materiasPrimas, { status: 200 })
  } catch (error) {
    console.error("API MateriaPrima/buscar - Error:", error)
    return NextResponse.json(
      {
        message: "Error al buscar materias primas",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

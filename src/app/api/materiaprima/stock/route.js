import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const auditoriaService = new AuditoriaService()

export async function GET(request) {
  try {
    console.log("API: Obteniendo stock de materias primas...")

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const idMateriaPrima = searchParams.get("idMateriaPrima") ? Number(searchParams.get("idMateriaPrima")) : null

    // Construir condiciones de búsqueda
    const where = {
      deletedAt: null,
    }

    // Si se proporciona un ID específico, filtrar por ese ID
    if (idMateriaPrima) {
      where.idMateriaPrima = idMateriaPrima
    }

    // Si hay término de búsqueda, añadir condición OR
    if (query.trim()) {
      where.OR = [
        { nombreMateriaPrima: { contains: query, mode: "insensitive" } },
        { descMateriaPrima: { contains: query, mode: "insensitive" } },
      ]
    }

    // Obtener materias primas con sus stocks actuales
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
      idRegistro: "stock",
      accion: "CONSULTAR",
      valorAnterior: null,
      valorNuevo: { query, idMateriaPrima },
      idUsuario: userData.idUsuario,
      request,
    })

    console.log(`API: Se encontraron ${materiasPrimas.length} materias primas con stock`)
    return NextResponse.json(materiasPrimas, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener stock de materias primas:", error)
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

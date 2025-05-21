import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    console.log("API: Obteniendo estados de materia prima...")

    const estados = await prisma.estadoMateriaPrima.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        descEstadoMateriaPrima: "asc",
      },
    })

    console.log(`API: Se encontraron ${estados.length} estados de materia prima`)
    return NextResponse.json(estados)
  } catch (error) {
    console.error("API: Error al obtener estados de materia prima:", error)
    return NextResponse.json({ error: "Error al obtener estados de materia prima" }, { status: 500 })
  }
}

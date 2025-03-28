import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const estadosMateriaPrima = await prisma.estadoMateriaPrima.findMany()
    return NextResponse.json(estadosMateriaPrima)
  } catch (error) {
    console.error("Error al obtener estados de materia prima:", error)
    return NextResponse.json({ error: "Error al obtener estados de materia prima" }, { status: 500 })
  }
}


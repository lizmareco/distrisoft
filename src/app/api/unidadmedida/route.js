import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const unidadesMedida = await prisma.unidadMedida.findMany()
    return NextResponse.json(unidadesMedida)
  } catch (error) {
    console.error("Error al obtener unidades de medida:", error)
    return NextResponse.json({ error: "Error al obtener unidades de medida" }, { status: 500 })
  }
}


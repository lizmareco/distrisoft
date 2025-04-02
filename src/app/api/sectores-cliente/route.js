import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sectores = await prisma.sectorCliente.findMany()
    return NextResponse.json(sectores)
  } catch (error) {
    console.error("Error al obtener sectores de cliente:", error)
    return NextResponse.json({ error: "Error al obtener sectores de cliente" }, { status: 500 })
  }
}


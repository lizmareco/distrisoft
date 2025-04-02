import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const categorias = await prisma.categoriaEmpresa.findMany()
    return NextResponse.json(categorias)
  } catch (error) {
    console.error("Error al obtener categorías de empresa:", error)
    return NextResponse.json({ error: "Error al obtener categorías de empresa" }, { status: 500 })
  }
}



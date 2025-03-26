import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("API categorias-empresa: Solicitud GET recibida")

    // Obtener todas las categorías de empresa
    const categoriasEmpresa = await prisma.categoriaEmpresa.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        nombre: "asc",
      },
    })

    console.log(`API categorias-empresa: Se encontraron ${categoriasEmpresa.length} categorías de empresa`)
    return NextResponse.json({ categoriasEmpresa })
  } catch (error) {
    console.error("Error al obtener categorías de empresa:", error)
    return NextResponse.json(
      { message: "Error al obtener categorías de empresa", error: error.message },
      { status: 500 },
    )
  }
}


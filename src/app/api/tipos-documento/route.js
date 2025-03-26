import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("API tipos-documento: Solicitud GET recibida")

    // Obtener todos los tipos de documento
    const tiposDocumento = await prisma.tipoDocumento.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        nombre: "asc",
      },
    })

    console.log(`API tipos-documento: Se encontraron ${tiposDocumento.length} tipos de documento`)
    return NextResponse.json({ tiposDocumento })
  } catch (error) {
    console.error("Error al obtener tipos de documento:", error)
    return NextResponse.json({ message: "Error al obtener tipos de documento", error: error.message }, { status: 500 })
  }
}


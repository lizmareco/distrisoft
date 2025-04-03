import { prisma } from "../../../../prisma/client.js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Obteniendo tipos de documento...")
    const tiposDocumento = await prisma.tipoDocumento.findMany()
    console.log(`Se encontraron ${tiposDocumento.length} tipos de documento`)
    return NextResponse.json(tiposDocumento)
  } catch (error) {
    console.error("Error al obtener tipos de documento:", error)
    return NextResponse.json({ error: "Error al obtener tipos de documento" }, { status: 500 })
  }
}


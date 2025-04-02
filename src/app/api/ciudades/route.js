import { prisma } from "../../../../prisma/client.js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Obteniendo ciudades...")
    const ciudades = await prisma.ciudad.findMany()
    console.log(`Se encontraron ${ciudades.length} ciudades`)
    return NextResponse.json(ciudades)
  } catch (error) {
    console.error("Error al obtener ciudades:", error)
    return NextResponse.json({ error: "Error al obtener ciudades" }, { status: 500 })
  }
}


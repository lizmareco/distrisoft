import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const condiciones = await prisma.condicionPago.findMany()
    return NextResponse.json(condiciones)
  } catch (error) {
    console.error("Error al obtener condiciones de pago:", error)
    return NextResponse.json({ error: "Error al obtener condiciones de pago" }, { status: 500 })
  }
}


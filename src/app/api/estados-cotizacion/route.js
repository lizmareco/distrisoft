import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const estados = await prisma.estadoCotizacionCliente.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        descEstadoCotizacionCliente: "asc",
      },
    })

    return NextResponse.json(estados)
  } catch (error) {
    console.error("Error al obtener estados de cotización:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

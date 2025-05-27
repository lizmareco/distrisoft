import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const estados = await prisma.estadoCuentaCobrar.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        idEstadoCuenta: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      data: estados,
    })
  } catch (error) {
    console.error("Error al obtener estados de cuenta:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

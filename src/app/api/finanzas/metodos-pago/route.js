import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const metodosPago = await prisma.metodoPago.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        descMetodoPago: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      data: metodosPago,
    })
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

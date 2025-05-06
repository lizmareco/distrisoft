import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET() {
  try {
    console.log("API: Obteniendo estados de producto...")

    const estados = await prisma.estadoProducto.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        descEstadoProducto: "asc",
      },
    })

    console.log(`API: Se encontraron ${estados.length} estados de producto`)
    return NextResponse.json(estados, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener estados de producto:", error)
    return NextResponse.json(
      { message: "Error al obtener estados de producto", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

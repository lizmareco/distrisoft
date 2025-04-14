import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET() {
  try {
    console.log("Obteniendo tipos de documento...")
    const tiposDocumento = await prisma.tipoDocumento.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        descTipoDocumento: "asc",
      },
    })

    console.log(`Se encontraron ${tiposDocumento.length} tipos de documento`)
    return NextResponse.json(tiposDocumento, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener tipos de documento:", error)
    return NextResponse.json(
      { error: "Error al obtener tipos de documento" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

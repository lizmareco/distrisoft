import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    console.log("API: Obteniendo todos los proveedores...")

    // Obtener todos los proveedores activos con sus relaciones
    const proveedores = await prisma.proveedor.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        empresa: {
          include: {
            tipoDocumento: true,
            categoriaEmpresa: true,
            ciudad: true,
          },
        },
      },
      orderBy: {
        idProveedor: "desc",
      },
      take: 100, // Limitar a 100 registros por defecto
    })

    console.log(`API: Se encontraron ${proveedores.length} proveedores`)
    return NextResponse.json(proveedores, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener todos los proveedores:", error)
    return NextResponse.json(
      {
        error: "Error al obtener proveedores",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

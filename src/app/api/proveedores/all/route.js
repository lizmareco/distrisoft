import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET() {
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
            persona: true,
            ciudad: true,
          },
        },
      },
      orderBy: {
        idProveedor: "desc", // Ordenar por ID descendente (más recientes primero)
      },
      take: 100, // Limitar a 100 resultados para evitar sobrecarga
    })

    console.log(`API: Se encontraron ${proveedores.length} proveedores`)

    // Verificar que los datos tengan la estructura esperada
    if (!Array.isArray(proveedores)) {
      console.error("API: Respuesta inesperada de la base de datos:", proveedores)
      throw new Error("Formato de respuesta inválido")
    }

    return NextResponse.json(proveedores, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener todos los proveedores:", error)

    // Devolver un mensaje de error más descriptivo
    return NextResponse.json(
      {
        error: "Error al obtener todos los proveedores",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

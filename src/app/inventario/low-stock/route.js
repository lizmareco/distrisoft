import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { cookies } from "next/headers"
import { verifyJwtToken } from "@/src/lib/jwt"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET() {
  try {
    // Obtener token de acceso
    const cookieStore = cookies()
    const token = cookieStore.get("at")?.value

    if (!token) {
      return NextResponse.json({ mostrarNotificacion: false }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Verificar token
    const decoded = await verifyJwtToken(token)
    if (!decoded || !decoded.idUsuario) {
      return NextResponse.json({ mostrarNotificacion: false }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Verificar si existe al menos una materia prima con stock bajo
    const lowStockCount = await prisma.materiaPrima.count({
      where: {
        deletedAt: null,
        stockActual: {
          lt: 10,
        },
      },
    })

    const mostrarNotificacion = lowStockCount > 0

    return NextResponse.json({ mostrarNotificacion }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error verificando stock bajo:", error)
    return NextResponse.json(
      { error: "Error al verificar materias primas con stock bajo" },
      { status: HTTP_STATUS_CODES.internalServerError }
    )
  }
}

import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const authController = new AuthController()

    // Verificar que el usuario esté autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Obtener el usuario del token
    const userData = await authController.getUserFromToken(accessToken)
    if (!userData) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Marcar todas las notificaciones como leídas
    await prisma.notificacion.updateMany({
      where: {
        usuarioDestino: userData.idUsuario,
        leido: false,
        deletedAt: null,
      },
      data: {
        leido: true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(
      { message: "Todas las notificaciones marcadas como leídas" },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("Error al marcar todas las notificaciones como leídas:", error)
    return NextResponse.json(
      { message: "Error al marcar todas las notificaciones como leídas" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


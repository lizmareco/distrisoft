import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

export async function GET(request) {
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

    // Obtener notificaciones del usuario
    const notifications = await prisma.notificacion.findMany({
      where: {
        usuarioDestino: userData.idUsuario,
        deletedAt: null,
      },
      orderBy: {
        fechaEnvio: "desc",
      },
      take: 20, // Limitar a las 20 más recientes
    })

    return NextResponse.json({ notifications }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json(
      { message: "Error al obtener notificaciones" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


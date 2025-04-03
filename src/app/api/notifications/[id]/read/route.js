import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

export async function POST(request, { params }) {
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

    const idNotificacion = Number.parseInt(params.id)

    // Verificar que la notificación exista y pertenezca al usuario
    const notificacion = await prisma.notificacion.findFirst({
      where: {
        idNotificacion: idNotificacion,
        usuarioDestino: userData.idUsuario,
        deletedAt: null,
      },
    })

    if (!notificacion) {
      return NextResponse.json({ message: "Notificación no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Marcar como leída
    await prisma.notificacion.update({
      where: {
        idNotificacion: idNotificacion,
      },
      data: {
        leido: true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Notificación marcada como leída" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error)
    return NextResponse.json(
      { message: "Error al marcar notificación como leída" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


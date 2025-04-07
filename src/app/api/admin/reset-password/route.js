import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { idUsuario, newPassword } = body
    const authController = new AuthController()

    console.log(`API reset-password: Intentando restablecer contraseña para usuario ID: ${idUsuario}`)

    if (!idUsuario || !newPassword) {
      return NextResponse.json(
        { message: "ID de usuario y nueva contraseña son requeridos" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que el usuario exista
    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: idUsuario,
        deletedAt: null,
      },
    })

    if (!usuario) {
      console.log(`API reset-password: Usuario con ID ${idUsuario} no encontrado`)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Obtener el ID del administrador que está realizando la acción
    let adminId = null
    const accessToken = request.cookies.get("at")?.value
    if (accessToken) {
      const adminData = await authController.getUserFromToken(accessToken)
      if (adminData) {
        adminId = adminData.idUsuario
      }
    }

    // Usar el método resetPassword del controlador que ya registra la auditoría
    const success = await authController.resetPassword(idUsuario, newPassword, request, adminId)

    if (success) {
      console.log(`API reset-password: Contraseña actualizada para usuario ID: ${idUsuario}`)
      return NextResponse.json({ message: "Contraseña restablecida exitosamente" }, { status: HTTP_STATUS_CODES.ok })
    } else {
      return NextResponse.json(
        { message: "Error al restablecer contraseña" },
        { status: HTTP_STATUS_CODES.internalServerError },
      )
    }
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json(
      {
        message: "Error al restablecer contraseña",
        error: error.message,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


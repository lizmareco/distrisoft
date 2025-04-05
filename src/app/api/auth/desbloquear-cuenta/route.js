import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const authController = new AuthController()

    // Verificar que el usuario actual esté autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Verificar rol de administrador (implementa esta lógica según tu sistema)
    const userData = await authController.getUserFromToken(accessToken)
    if (!userData || userData.rol !== "ADMINISTRADOR_SISTEMA") {
      return NextResponse.json(
        { message: "No tienes permisos para realizar esta acción" },
        { status: HTTP_STATUS_CODES.forbidden },
      )
    }

    // Obtener el ID del usuario a desbloquear
    const { idUsuario } = await request.json()

    if (!idUsuario) {
      return NextResponse.json({ message: "ID de usuario requerido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Desbloquear la cuenta usando el método que ya registra la auditoría
    await authController.desbloquearCuenta(idUsuario, request)

    return NextResponse.json({ message: "Cuenta desbloqueada exitosamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error en /api/auth/desbloquear-cuenta: ", error)
    return NextResponse.json({ message: "Ha ocurrido un error" }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}


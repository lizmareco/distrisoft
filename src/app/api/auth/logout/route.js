import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

export async function POST(request) {
  try {
    const authController = new AuthController()

    // Obtener tokens de las cookies
    const accessToken = request.cookies.get("at")?.value
    const refreshToken = request.cookies.get("rt")?.value

    // Invalidar tokens en la base de datos
    if (accessToken) {
      // Usar el método logout que ya registra la auditoría
      await authController.logout(request, accessToken)
    }

    if (refreshToken) {
      await authController.invalidarRefreshToken(refreshToken)
    }

    // Crear respuesta y eliminar cookies
    const response = NextResponse.json({ message: "Sesión cerrada exitosamente" }, { status: HTTP_STATUS_CODES.ok })

    response.cookies.delete("at")
    response.cookies.delete("rt")

    return response
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    return NextResponse.json({ message: "Error al cerrar sesión" }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}


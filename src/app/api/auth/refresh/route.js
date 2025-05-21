import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

export async function POST(request) {
  try {
    console.log("API: Procesando solicitud de refresh token")
    const authController = new AuthController()

    // Obtener el refresh token del cuerpo de la solicitud
    const body = await request.json()
    const refreshToken = body.refreshToken

    if (!refreshToken) {
      console.log("API: No se proporcionó refresh token")
      return NextResponse.json(
        { message: "No se proporcionó refresh token", success: false },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Intentar refrescar el token
    const result = await authController.refreshAccessToken(refreshToken, request)

    if (!result) {
      console.log("API: Refresh token inválido o expirado")
      return NextResponse.json(
        { message: "Refresh token inválido o expirado", success: false },
        { status: HTTP_STATUS_CODES.unauthorized },
      )
    }

    console.log("API: Token refrescado correctamente")

    // Devolver los nuevos tokens
    return NextResponse.json({
      message: "Token refrescado correctamente",
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (error) {
    console.error("API: Error al refrescar token:", error)
    return NextResponse.json(
      { message: "Error al refrescar token", error: error.message, success: false },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

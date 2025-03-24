import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/settings"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const authController = new AuthController()

    // Obtener el refresh token de las cookies
    const refreshToken = request.cookies.get("rt")?.value

    if (!refreshToken) {
      return NextResponse.json(
        { message: "No se encontró el token de refresco" },
        { status: HTTP_STATUS_CODES.unauthorized },
      )
    }

    // Verificar y renovar el token
    const tokens = await authController.refreshAccessToken(refreshToken)

    if (!tokens) {
      return NextResponse.json(
        { message: "Token de refresco inválido o expirado" },
        { status: HTTP_STATUS_CODES.unauthorized },
      )
    }

    // Crear respuesta con nuevos tokens
    const response = NextResponse.json({ message: "Sesión renovada exitosamente" }, { status: HTTP_STATUS_CODES.ok })

    // Establecer nuevas cookies
    response.cookies.set("at", tokens.accessToken, {
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    response.cookies.set("rt", tokens.refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Error al refrescar el token:", error)
    return NextResponse.json(
      { message: "Error al renovar la sesión" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


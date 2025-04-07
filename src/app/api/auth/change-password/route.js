import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body
    const authController = new AuthController()

    // Obtener el token de la cookie o del encabezado de autorización
    const authHeader = request.headers.get("authorization")
    let token = null

    // Intentar obtener el token del encabezado de autorización
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
      console.log("Token obtenido del encabezado:", token ? "Sí" : "No")
    }

    // Si no hay token en el encabezado, intentar obtenerlo de las cookies
    if (!token) {
      const cookieStore = cookies()
      const accessToken = cookieStore.get("at")?.value
      if (accessToken) {
        token = accessToken
        console.log("Token obtenido de las cookies:", token ? "Sí" : "No")
      }
    }

    // Si aún no hay token, verificar si hay un ID de usuario en el cuerpo de la solicitud
    if (!token && body.userId) {
      // Modificar la parte donde se procesa el userId del cuerpo de la solicitud
      const userId = Number.parseInt(body.userId, 10)
      console.log("ID de usuario convertido a número:", userId)

      try {
        // Usar el método cambiarContrasena del controlador que ya registra la auditoría
        const success = await authController.cambiarContrasena(userId, currentPassword, newPassword, request)

        if (success) {
          return NextResponse.json(
            { message: "Contraseña actualizada correctamente" },
            { status: HTTP_STATUS_CODES.ok },
          )
        } else {
          return NextResponse.json(
            { error: "Error al cambiar la contraseña" },
            { status: HTTP_STATUS_CODES.internalServerError },
          )
        }
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
      }
    }

    // Verificar que haya un token
    if (!token) {
      console.error("No se encontró token de acceso")
      return NextResponse.json(
        { error: "No autorizado - Token no proporcionado" },
        { status: HTTP_STATUS_CODES.unauthorized },
      )
    }

    // Verificar el token y obtener el ID de usuario
    let userData
    try {
      userData = await authController.getUserFromToken(token)
      if (!userData) {
        throw new Error("Token inválido")
      }
    } catch (error) {
      console.error("Error al verificar el token:", error)
      return NextResponse.json({ error: "No autorizado - Token inválido" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userId = userData.idUsuario
    console.log("ID de usuario:", userId)

    try {
      // Usar el método cambiarContrasena del controlador que ya registra la auditoría
      const success = await authController.cambiarContrasena(userId, currentPassword, newPassword, request)

      if (success) {
        return NextResponse.json({ message: "Contraseña actualizada correctamente" }, { status: HTTP_STATUS_CODES.ok })
      } else {
        return NextResponse.json(
          { error: "Error al cambiar la contraseña" },
          { status: HTTP_STATUS_CODES.internalServerError },
        )
      }
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
    }
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error)
    return NextResponse.json(
      { error: "Error al cambiar la contraseña: " + error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()
const authController = new AuthController()

export async function GET(request) {
  console.log("API Auth/check - Iniciando verificación de autenticación")

  try {
    // Verificar token de acceso
    const accessToken = await authController.hasAccessToken(request)

    if (!accessToken) {
      console.log("API Auth/check - No se encontró token válido")

      // En desarrollo, permitir acceso sin token
      if (process.env.NODE_ENV === "development") {
        console.log("API Auth/check - Modo desarrollo: Generando token de desarrollo")

        // Buscar un usuario para usar en desarrollo
        const usuario = await prisma.usuario.findFirst({
          where: { deletedAt: null },
          select: {
            idUsuario: true,
            nombreUsuario: true,
            rol: { select: { nombreRol: true } },
          },
        })

        if (usuario) {
          // Generar un token de desarrollo
          const devToken = await authController.generateAccessToken({
            idUsuario: usuario.idUsuario,
            usuario: usuario.nombreUsuario,
            rol: usuario.rol.nombreRol,
          })

          return NextResponse.json({
            authenticated: true,
            message: "Autenticado en modo desarrollo",
            user: {
              idUsuario: usuario.idUsuario,
              nombreUsuario: usuario.nombreUsuario,
              rol: usuario.rol.nombreRol,
            },
            accessToken: devToken,
          })
        }
      }

      return NextResponse.json({
        authenticated: false,
        message: "No autenticado",
      })
    }

    // Verificar si el token es válido
    const userData = await authController.getUserFromToken(accessToken)

    if (!userData) {
      console.log("API Auth/check - Token inválido o expirado")
      return NextResponse.json({
        authenticated: false,
        message: "Token inválido o expirado",
      })
    }

    console.log("API Auth/check - Usuario autenticado:", userData.idUsuario)

    return NextResponse.json({
      authenticated: true,
      message: "Autenticado correctamente",
      user: userData,
    })
  } catch (error) {
    console.error("API Auth/check - Error al verificar autenticación:", error)
    return NextResponse.json(
      {
        authenticated: false,
        message: "Error al verificar autenticación",
        error: error.message,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

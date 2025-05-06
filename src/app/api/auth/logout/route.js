import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import { cookies } from "next/headers"

export async function POST(request) {
  try {
    console.log("API: Procesando solicitud de cierre de sesión")
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // Obtener el token de autenticación
    const accessToken = await authController.hasAccessToken(request)

    if (!accessToken) {
      console.log("API: No se encontró token de acceso para cerrar sesión")
      // Limpiar cookies de todas formas
      cookies().delete("accessToken")
      cookies().delete("refreshToken")

      return NextResponse.json({ message: "Sesión cerrada (no había token activo)" }, { status: HTTP_STATUS_CODES.ok })
    }

    // Obtener información del usuario para la auditoría
    const userData = await authController.getUserFromToken(accessToken)

    if (userData) {
      console.log(`API: Cerrando sesión del usuario ID: ${userData.idUsuario}`)

      try {
        // Buscar el token en la base de datos
        const tokenRecord = await prisma.accessToken.findFirst({
          where: {
            accessToken: accessToken,
            deletedAt: null,
          },
        })

        if (tokenRecord) {
          // Marcar el token como eliminado (soft delete)
          await prisma.accessToken.update({
            where: {
              idAccessToken: tokenRecord.idAccessToken,
            },
            data: {
              deletedAt: new Date(),
            },
          })

          // Si hay un refreshToken asociado, también marcarlo como eliminado
          const refreshToken = await prisma.refreshToken.findFirst({
            where: {
              idAccessToken: tokenRecord.idAccessToken,
              deletedAt: null,
            },
          })

          if (refreshToken) {
            await prisma.refreshToken.update({
              where: {
                idRefreshToken: refreshToken.idRefreshToken,
              },
              data: {
                deletedAt: new Date(),
              },
            })
          }

          // Registrar la acción en auditoría usando el método existente
          await auditoriaService.registrarAutenticacion(request, userData.idUsuario, "LOGOUT", {
            tokenId: tokenRecord.idAccessToken,
            mensaje: "Cierre de sesión exitoso",
          })
        }
      } catch (dbError) {
        console.error("API: Error al invalidar tokens en la base de datos:", dbError)
        // Continuar con el proceso de cierre de sesión aunque falle la BD
      }
    }

    // Limpiar cookies
    cookies().delete("accessToken")
    cookies().delete("refreshToken")

    return NextResponse.json({ message: "Sesión cerrada exitosamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al cerrar sesión:", error)

    // Intentar limpiar cookies de todas formas
    cookies().delete("accessToken")
    cookies().delete("refreshToken")

    return NextResponse.json(
      { message: "Error al cerrar sesión", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

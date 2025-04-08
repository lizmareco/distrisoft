import { NextResponse } from "next/server"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function POST(request) {
  try {
    const authController = new AuthController()

    // Obtener el correo del cuerpo de la solicitud
    const { correo } = await request.json()

    if (!correo) {
      return NextResponse.json(
        { message: "El correo electrónico es requerido" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Solicitar recuperación de contraseña - pasar un objeto con la propiedad correo
    const result = await authController.solicitarRecuperacionContrasena({ correo })

    // Por seguridad, siempre devolvemos un mensaje de éxito, incluso si el correo no existe
    return NextResponse.json(
      {
        success: true,
        message: "Si el correo existe en nuestro sistema, recibirás instrucciones para recuperar tu contraseña",
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    if (error.isCustom) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    } else {
      console.error("Error en /api/auth/forgot-password: ", JSON.stringify(error, null, 2))
      return NextResponse.json(
        { message: "Ha ocurrido un error al procesar tu solicitud" },
        { status: HTTP_STATUS_CODES.internalServerError },
      )
    }
  }
}
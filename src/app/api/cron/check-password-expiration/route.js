import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import PasswordExpirationService from "@/src/backend/services/password-expiration-service"

// Esta ruta puede ser llamada por un servicio de cron como Vercel Cron Jobs
export async function GET(request) {
  try {
    // Verificar clave secreta para proteger el endpoint (opcional)
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    if (process.env.CRON_API_KEY && apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const passwordExpirationService = new PasswordExpirationService()

    // Ejecutar la verificación de vencimientos
    await passwordExpirationService.verificarVencimientosContrasenas()

    return NextResponse.json(
      { message: "Verificación de vencimientos de contraseñas completada" },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("Error al verificar vencimientos de contraseñas:", error)
    return NextResponse.json(
      { message: "Error al verificar vencimientos de contraseñas", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


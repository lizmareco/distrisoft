import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET(request) {
  try {
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // En desarrollo, omitimos la verificación de autenticación
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!isDevelopment) {
      // Verificar que el usuario esté autenticado
      const accessToken = await authController.hasAccessToken(request)
      if (!accessToken) {
        return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }

      // Obtener el usuario del token
      const userData = await authController.getUserFromToken(accessToken)
      if (!userData) {
        return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }

      // Verificar que el usuario tenga permisos de administrador
      if (userData.rol !== "ADMINISTRADOR") {
        return NextResponse.json(
          { message: "No tienes permisos para acceder a esta información" },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }
    } else {
      console.log("Modo desarrollo: Omitiendo verificación de autenticación para la API de exportación de auditoría")
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const entidad = searchParams.get("entidad")
    const idRegistro = searchParams.get("idRegistro")
    const accion = searchParams.get("accion")
    const idUsuario = searchParams.get("idUsuario") ? Number.parseInt(searchParams.get("idUsuario")) : null
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")

    // Obtener registros de auditoría sin paginación (o con un límite muy alto)
    const resultado = await auditoriaService.obtenerRegistros({
      page: 1,
      limit: 10000, // Límite alto para exportación
      entidad,
      idRegistro,
      accion,
      idUsuario,
      fechaInicio,
      fechaFin,
    })

    return NextResponse.json(resultado, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener registros de auditoría para exportación:", error)
    return NextResponse.json(
      { message: "Error al obtener registros de auditoría", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


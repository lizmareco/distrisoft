import AuditoriaService from "@/src/backend/services/auditoria-service"

const auditoriaService = new AuditoriaService()

/**
 * Función para auditar acciones de autenticación
 * @param {Object} request - Objeto de solicitud HTTP
 * @param {number|null} idUsuario - ID del usuario (null si no está autenticado)
 * @param {string} tipoAccion - Tipo de acción (LOGIN_EXITOSO, LOGIN_FALLIDO, etc.)
 * @param {Object} detalles - Detalles adicionales para la auditoría
 */
export async function auditarAutenticacion(request, idUsuario, tipoAccion, detalles = {}) {
  try {
    // Agregar log para depuración
    console.log(`Registrando auditoría de autenticación: ${tipoAccion} para usuario ID: ${idUsuario}`, detalles)

    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarAuditoria({
      entidad: "Usuario",
      idRegistro: idUsuario || "0",
      accion: tipoAccion,
      valorAnterior: null,
      valorNuevo: detalles,
      idUsuario: idUsuario || 0,
      request,
    })
  } catch (error) {
    console.error("Error al auditar autenticación:", error)
  }
}

/**
 * Middleware para capturar información para auditoría
 * @param {Request} request - Objeto de solicitud HTTP
 * @param {Function} next - Función para continuar con la siguiente middleware
 */
export async function auditoriaMiddleware(request, next) {
  // Capturar información relevante para auditoría
  const requestInfo = {
    ip: auditoriaService.obtenerDireccionIP(request),
    userAgent: auditoriaService.obtenerInfoNavegador(request),
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
  }

  // Almacenar información en el objeto de solicitud para uso posterior
  request.auditoriaInfo = requestInfo

  // Continuar con la solicitud
  const response = await next()

  // También podríamos modificar la respuesta si fuera necesario
  return response
}


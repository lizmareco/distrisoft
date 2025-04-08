import { PrismaClient } from "@prisma/client"
import { UAParser } from "ua-parser-js"

const prisma = new PrismaClient()

class AuditoriaService {
  /**
   * Registra una acción en el sistema de auditoría
   * @param {Object} params - Parámetros para el registro de auditoría
   * @param {string} params.entidad - Nombre de la entidad afectada (ej: "Usuario", "Producto")
   * @param {string|number} params.idRegistro - ID del registro afectado
   * @param {string} params.accion - Tipo de acción (ej: "CREAR", "ACTUALIZAR", "ELIMINAR")
   * @param {Object|null} params.valorAnterior - Valor anterior del registro (opcional)
   * @param {Object|null} params.valorNuevo - Nuevo valor del registro (opcional)
   * @param {number} params.idUsuario - ID del usuario que realizó la acción
   * @param {Object|null} params.request - Objeto de solicitud HTTP (opcional)
   */
  async registrarAuditoria({
    entidad,
    idRegistro,
    accion,
    valorAnterior = null,
    valorNuevo = null,
    idUsuario,
    request = null,
    direccionIP = null,
    navegador = null,
  }) {
    try {
      console.log(`Iniciando registro de auditoría: ${accion} en ${entidad} ID: ${idRegistro}`)

      // Convertir valores a string JSON si son objetos
      const valorAnteriorStr = valorAnterior ? JSON.stringify(valorAnterior) : null
      const valorNuevoStr = valorNuevo ? JSON.stringify(valorNuevo) : null

      // Obtener información del contexto HTTP si está disponible
      let ip = direccionIP
      let browser = navegador

      if (request && (!ip || !browser)) {
        ip = ip || this.obtenerDireccionIP(request)
        browser = browser || this.obtenerInfoNavegador(request)
      }

      console.log("Datos para auditoría:", {
        entidad,
        idRegistro: String(idRegistro),
        accion,
        valorAnterior: valorAnterior ? "Presente" : "Null",
        valorNuevo: valorNuevo ? "Presente" : "Null",
        idUsuario,
        direccionIP: ip,
        navegador: browser,
      })

      // Crear el registro de auditoría
      const auditoria = await prisma.auditoria.create({
        data: {
          entidad,
          idRegistro: String(idRegistro), // Asegurar que sea string
          accion,
          valorAnterior: valorAnteriorStr,
          valorNuevo: valorNuevoStr,
          idUsuario,
          direccionIP: ip || "desconocida",
          navegador: browser || "desconocido",
          fechaCreacion: new Date(),
        },
      })

      console.log(`Auditoría registrada exitosamente con ID: ${auditoria.idAuditoria}`)
      return auditoria
    } catch (error) {
      console.error("Error al registrar auditoría:", error)
      // No lanzamos el error para evitar interrumpir el flujo principal
      return null
    }
  }

  /**
   * Verifica si una dirección IP es IPv4
   * @param {string} ip - Dirección IP a verificar
   * @returns {boolean} true si es IPv4, false si no
   */
  esIPv4(ip) {
    // Patrón para IPv4: cuatro grupos de 1-3 dígitos separados por puntos
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    return ipv4Pattern.test(ip)
  }

  /**
   * Convierte direcciones IPv6 especiales a sus equivalentes IPv4
   * @param {string} ip - Dirección IP a convertir
   * @returns {string} Dirección IP convertida o la original
   */
  convertirIPv6EspecialAIPv4(ip) {
    // Convertir ::1 (localhost IPv6) a 127.0.0.1 (localhost IPv4)
    if (ip === "::1") {
      return "127.0.0.1"
    }

    // Convertir ::ffff:192.0.2.1 a 192.0.2.1 (formato IPv4-mapped IPv6)
    const ipv4MappedPattern = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/
    const match = ip.match(ipv4MappedPattern)
    if (match) {
      return match[1]
    }

    return ip
  }

  /**
   * Obtiene la dirección IP real del cliente, priorizando IPv4 sobre IPv6
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {string} Dirección IP del cliente
   */
  obtenerDireccionIP(request) {
    try {
      // Función para procesar una IP o lista de IPs
      const procesarIP = (ip) => {
        if (!ip) return null

        // Si es una lista de IPs (como en X-Forwarded-For), tomar la primera
        if (ip.includes(",")) {
          const ips = ip.split(",").map((i) => i.trim())

          // Buscar primero una IPv4 en la lista
          const ipv4 = ips.find((i) => this.esIPv4(i))
          if (ipv4) return ipv4

          // Si no hay IPv4, tomar la primera IP (que será IPv6)
          return this.convertirIPv6EspecialAIPv4(ips[0])
        }

        // Si es una sola IP, convertir si es necesario
        return this.convertirIPv6EspecialAIPv4(ip)
      }

      // Verificar múltiples encabezados en orden de prioridad
      const headers = ["cf-connecting-ip", "x-forwarded-for", "x-real-ip", "true-client-ip"]

      // Coleccionar todas las IPs encontradas
      const ipsEncontradas = []

      for (const header of headers) {
        const headerValue = request.headers.get(header)
        if (headerValue) {
          const ip = procesarIP(headerValue)
          if (ip) ipsEncontradas.push(ip)
        }
      }

      // Intentar obtener la IP directamente del objeto request
      if (request.socket && request.socket.remoteAddress) {
        const ip = this.convertirIPv6EspecialAIPv4(request.socket.remoteAddress)
        ipsEncontradas.push(ip)
      }

      if (request.connection && request.connection.remoteAddress) {
        const ip = this.convertirIPv6EspecialAIPv4(request.connection.remoteAddress)
        ipsEncontradas.push(ip)
      }

      if (request.ip) {
        const ip = this.convertirIPv6EspecialAIPv4(request.ip)
        ipsEncontradas.push(ip)
      }

      // Priorizar IPv4 sobre IPv6
      const ipv4Encontrada = ipsEncontradas.find((ip) => this.esIPv4(ip))
      if (ipv4Encontrada) {
        return ipv4Encontrada
      }

      // Si no hay IPv4, usar la primera IP encontrada (que será IPv6)
      if (ipsEncontradas.length > 0) {
        return ipsEncontradas[0]
      }

      // Si estamos en desarrollo y no podemos obtener una IP real,
      // proporcionar una IP de ejemplo para pruebas
      if (process.env.NODE_ENV === "development") {
        return "192.168.1.100" // IP de ejemplo para desarrollo
      }

      return "desconocida"
    } catch (error) {
      console.warn("Error al obtener dirección IP:", error.message)
      return "desconocida"
    }
  }

  /**
   * Obtiene información del navegador del cliente
   * @param {Object} request - Objeto de solicitud HTTP
   * @returns {string|null} Información del navegador o null
   */
  obtenerInfoNavegador(request) {
    try {
      const userAgent = request.headers.get("user-agent")
      return this.parseUserAgent(userAgent)
    } catch (error) {
      console.warn("Error al obtener información del navegador:", error.message)
      return "desconocido"
    }
  }

  /**
   * Parsea el user-agent para obtener información del navegador
   * @param {string} userAgent - String del user-agent
   * @returns {string} Información formateada del navegador
   */
  parseUserAgent(userAgent) {
    if (!userAgent) return "Desconocido"

    try {
      const parser = new UAParser(userAgent)
      const result = parser.getResult()

      return `${result.browser.name || "Desconocido"} ${result.browser.version || ""} - ${result.os.name || "Desconocido"} ${result.os.version || ""}`
    } catch (error) {
      return userAgent.substring(0, 255) // Limitar longitud
    }
  }

  /**
   * Registra una acción de autenticación
   * @param {Object} request - Objeto de solicitud HTTP
   * @param {number} idUsuario - ID del usuario
   * @param {string} tipoAccion - Tipo de acción de autenticación
   * @param {Object} detalles - Detalles adicionales
   */
  async registrarAutenticacion(request, idUsuario, tipoAccion, detalles = {}) {
    const direccionIP = detalles.ip || this.obtenerDireccionIP(request)
    const navegador = detalles.navegador || this.obtenerInfoNavegador(request)

    return this.registrarAuditoria({
      entidad: "Usuario",
      idRegistro: idUsuario || "0",
      accion: tipoAccion,
      valorAnterior: null,
      valorNuevo: detalles,
      idUsuario: idUsuario || 0,
      direccionIP,
      navegador,
    })
  }

  /**
   * Registra una creación de registro
   * @param {string} entidad - Nombre de la entidad
   * @param {string|number} idRegistro - ID del registro creado
   * @param {Object} valorNuevo - Datos del nuevo registro
   * @param {number} idUsuario - ID del usuario que realizó la acción
   * @param {Object} request - Objeto de solicitud HTTP
   */
  async registrarCreacion(entidad, idRegistro, valorNuevo, idUsuario, request) {
    console.log(`Registrando CREACIÓN de ${entidad} con ID ${idRegistro}`)
    return this.registrarAuditoria({
      entidad,
      idRegistro,
      accion: "CREAR",
      valorAnterior: null,
      valorNuevo,
      idUsuario,
      request,
    })
  }

  /**
   * Registra una actualización de registro
   * @param {string} entidad - Nombre de la entidad
   * @param {string|number} idRegistro - ID del registro actualizado
   * @param {Object} valorAnterior - Datos anteriores del registro
   * @param {Object} valorNuevo - Nuevos datos del registro
   * @param {number} idUsuario - ID del usuario que realizó la acción
   * @param {Object} request - Objeto de solicitud HTTP
   */
  async registrarActualizacion(entidad, idRegistro, valorAnterior, valorNuevo, idUsuario, request) {
    console.log(`Registrando ACTUALIZACIÓN de ${entidad} con ID ${idRegistro}`)
    return this.registrarAuditoria({
      entidad,
      idRegistro,
      accion: "ACTUALIZAR",
      valorAnterior,
      valorNuevo,
      idUsuario,
      request,
    })
  }

  /**
   * Registra una eliminación de registro
   * @param {string} entidad - Nombre de la entidad
   * @param {string|number} idRegistro - ID del registro eliminado
   * @param {Object} valorAnterior - Datos del registro eliminado
   * @param {number} idUsuario - ID del usuario que realizó la acción
   * @param {Object} request - Objeto de solicitud HTTP
   */
  async registrarEliminacion(entidad, idRegistro, valorAnterior, idUsuario, request) {
    console.log(`Registrando ELIMINACIÓN de ${entidad} con ID ${idRegistro}`)
    return this.registrarAuditoria({
      entidad,
      idRegistro,
      accion: "ELIMINAR",
      valorAnterior,
      valorNuevo: null,
      idUsuario,
      request,
    })
  }

  /**
   * Obtiene los registros de auditoría con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Object>} Registros de auditoría y metadatos
   */
  async obtenerRegistros({
    page = 1,
    limit = 10,
    entidad = null,
    idRegistro = null,
    accion = null,
    idUsuario = null,
    fechaInicio = null,
    fechaFin = null,
  }) {
    try {
      const skip = (page - 1) * limit

      // Construir condiciones de filtro
      const where = {}

      if (entidad) where.entidad = entidad
      if (idRegistro) where.idRegistro = String(idRegistro)
      if (accion) where.accion = accion
      if (idUsuario) where.idUsuario = idUsuario

      // Filtro por rango de fechas
      if (fechaInicio || fechaFin) {
        where.fechaCreacion = {}
        if (fechaInicio) where.fechaCreacion.gte = new Date(fechaInicio)
        if (fechaFin) where.fechaCreacion.lte = new Date(fechaFin)
      }

      // Obtener registros con paginación
      const [registros, total] = await Promise.all([
        prisma.auditoria.findMany({
          where,
          include: {
            usuario: {
              select: {
                nombreUsuario: true,
                persona: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
          },
          orderBy: {
            fechaCreacion: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.auditoria.count({ where }),
      ])

      // Procesar registros para mostrar valores anteriores y nuevos como objetos
      const registrosProcesados = registros.map((registro) => {
        try {
          return {
            ...registro,
            valorAnterior: registro.valorAnterior ? JSON.parse(registro.valorAnterior) : null,
            valorNuevo: registro.valorNuevo ? JSON.parse(registro.valorNuevo) : null,
          }
        } catch (error) {
          // Si hay error al parsear, devolver los valores como están
          return registro
        }
      })

      return {
        registros: registrosProcesados,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error("Error al obtener registros de auditoría:", error)
      throw error
    }
  }
}

export default AuditoriaService


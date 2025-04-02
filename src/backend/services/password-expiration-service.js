import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Constantes para la configuración de vencimiento
const DIAS_VENCIMIENTO = 90 // Días hasta que vence la contraseña
const DIAS_NOTIFICACION = 10 // Días antes para notificar

class PasswordExpirationService {
  /**
   * Verifica usuarios con contraseñas próximas a vencer o vencidas
   * y realiza las acciones correspondientes
   */
  async verificarVencimientosContrasenas() {
    try {
      console.log("Iniciando verificación de vencimientos de contraseñas...")

      const fechaActual = new Date()

      // Mostrar información de depuración sobre todos los usuarios
      await this.mostrarInformacionUsuarios(fechaActual)

      // 1. Encontrar usuarios con contraseñas vencidas y cambiar su estado a VENCIDO
      await this.bloquearUsuariosConContrasenaVencida(fechaActual)

      // 2. Encontrar usuarios con contraseñas próximas a vencer y enviar notificaciones
      await this.notificarUsuariosConContrasenaProximaAVencer(fechaActual)

      console.log("Verificación de vencimientos de contraseñas completada")
    } catch (error) {
      console.error("Error al verificar vencimientos de contraseñas:", error)
      throw error
    }
  }

  /**
   * Muestra información de depuración sobre todos los usuarios
   */
  async mostrarInformacionUsuarios(fechaActual) {
    try {
      // Calcular la fecha límite (hoy - 90 días)
      const fechaLimite = new Date(fechaActual)
      fechaLimite.setDate(fechaLimite.getDate() - DIAS_VENCIMIENTO)

      // Calcular la fecha de notificación (hoy - (90-10) días)
      const fechaNotificacion = new Date(fechaActual)
      fechaNotificacion.setDate(fechaNotificacion.getDate() - (DIAS_VENCIMIENTO - DIAS_NOTIFICACION))

      // Obtener todos los usuarios activos
      const usuarios = await prisma.usuario.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          idUsuario: true,
          nombreUsuario: true,
          estado: true,
          ultimoCambioContrasena: true,
          persona: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: {
          ultimoCambioContrasena: "asc",
        },
      })

      console.log(`Total de usuarios encontrados: ${usuarios.length}`)
      console.log(`Fecha actual: ${fechaActual.toISOString()}`)
      console.log(`Fecha límite para vencimiento (${DIAS_VENCIMIENTO} días): ${fechaLimite.toISOString()}`)
      console.log(
        `Fecha para notificación (${DIAS_VENCIMIENTO - DIAS_NOTIFICACION} días): ${fechaNotificacion.toISOString()}`,
      )

      // Mostrar información de cada usuario
      usuarios.forEach((usuario) => {
        const diasTranscurridos = Math.floor(
          (fechaActual - new Date(usuario.ultimoCambioContrasena)) / (1000 * 60 * 60 * 24),
        )
        const diasRestantes = DIAS_VENCIMIENTO - diasTranscurridos

        console.log(`\nUsuario: ${usuario.nombreUsuario} (ID: ${usuario.idUsuario})`)
        console.log(`Nombre: ${usuario.persona?.nombre || "N/A"} ${usuario.persona?.apellido || "N/A"}`)
        console.log(`Estado: ${usuario.estado}`)
        console.log(`Último cambio de contraseña: ${usuario.ultimoCambioContrasena.toISOString()}`)
        console.log(`Días transcurridos: ${diasTranscurridos}`)
        console.log(`Días restantes: ${diasRestantes}`)

        if (usuario.ultimoCambioContrasena < fechaLimite) {
          console.log(`ESTADO: CONTRASEÑA VENCIDA (${Math.abs(diasRestantes)} días de retraso)`)
        } else if (usuario.ultimoCambioContrasena < fechaNotificacion) {
          console.log(`ESTADO: CONTRASEÑA PRÓXIMA A VENCER (${diasRestantes} días restantes)`)
        } else {
          console.log(`ESTADO: CONTRASEÑA VIGENTE (${diasRestantes} días restantes)`)
        }
      })

      return usuarios.length
    } catch (error) {
      console.error("Error al mostrar información de usuarios:", error)
      throw error
    }
  }

  /**
   * Bloquea usuarios cuyas contraseñas han vencido
   */
  async bloquearUsuariosConContrasenaVencida(fechaActual) {
    try {
      // Calcular la fecha límite (hoy - 90 días)
      const fechaLimite = new Date(fechaActual)
      fechaLimite.setDate(fechaLimite.getDate() - DIAS_VENCIMIENTO)

      console.log(`Buscando usuarios con contraseñas vencidas (antes de ${fechaLimite.toISOString()})...`)

      // Encontrar usuarios con contraseñas vencidas y estado ACTIVO
      const usuariosConContrasenaVencida = await prisma.usuario.findMany({
        where: {
          ultimoCambioContrasena: {
            lt: fechaLimite, // Menor que la fecha límite
          },
          estado: "ACTIVO",
          deletedAt: null,
        },
        include: {
          persona: true,
        },
      })

      console.log(`Se encontraron ${usuariosConContrasenaVencida.length} usuarios con contraseñas vencidas`)

      // Mostrar detalles de los usuarios encontrados
      usuariosConContrasenaVencida.forEach((usuario) => {
        const diasVencidos =
          Math.floor((fechaActual - new Date(usuario.ultimoCambioContrasena)) / (1000 * 60 * 60 * 24)) -
          DIAS_VENCIMIENTO
        console.log(
          `- Usuario: ${usuario.nombreUsuario}, Último cambio: ${usuario.ultimoCambioContrasena.toISOString()}, Días vencidos: ${diasVencidos}`,
        )
      })

      // Cambiar estado a VENCIDO en lugar de BLOQUEADO
      for (const usuario of usuariosConContrasenaVencida) {
        // Actualizar estado a VENCIDO
        await prisma.usuario.update({
          where: {
            idUsuario: usuario.idUsuario,
          },
          data: {
            estado: "VENCIDO",
            updatedAt: fechaActual,
          },
        })

        // Crear notificación de cuenta vencida
        await prisma.notificacion.create({
          data: {
            mensaje:
              "Tu cuenta ha sido suspendida porque tu contraseña ha vencido. Por favor, contacta al administrador para restablecerla.",
            fechaEnvio: fechaActual,
            usuarioDestino: usuario.idUsuario,
            leido: false,
          },
        })

        console.log(`Usuario ${usuario.nombreUsuario} marcado como VENCIDO por contraseña vencida`)
      }

      return usuariosConContrasenaVencida.length
    } catch (error) {
      console.error("Error al marcar usuarios con contraseña vencida:", error)
      throw error
    }
  }

  /**
   * Notifica a usuarios cuyas contraseñas están próximas a vencer
   */
  async notificarUsuariosConContrasenaProximaAVencer(fechaActual) {
    try {
      // Calcular la fecha de notificación (hoy - (90-10) días)
      const fechaNotificacionInicio = new Date(fechaActual)
      fechaNotificacionInicio.setDate(fechaNotificacionInicio.getDate() - (DIAS_VENCIMIENTO - DIAS_NOTIFICACION))

      // Modificar esta línea para ampliar el rango de notificación
      // En lugar de solo notificar usuarios con 80-81 días, notificar a todos los que tienen 80-90 días
      const fechaNotificacionFin = new Date(fechaActual)
      fechaNotificacionFin.setDate(fechaNotificacionFin.getDate() - DIAS_VENCIMIENTO)

      console.log(
        `Buscando usuarios con contraseñas próximas a vencer (entre ${fechaNotificacionFin.toISOString()} y ${fechaNotificacionInicio.toISOString()})...`,
      )

      // Encontrar usuarios con contraseñas próximas a vencer
      const usuariosANotificar = await prisma.usuario.findMany({
        where: {
          ultimoCambioContrasena: {
            lte: fechaNotificacionInicio,
            gt: fechaNotificacionFin,
          },
          estado: "ACTIVO",
          deletedAt: null,
        },
      })

      console.log(`Se encontraron ${usuariosANotificar.length} usuarios para notificar sobre vencimiento próximo`)

      // Mostrar detalles de los usuarios encontrados
      usuariosANotificar.forEach((usuario) => {
        const fechaVencimiento = new Date(usuario.ultimoCambioContrasena)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + DIAS_VENCIMIENTO)
        const diasRestantes = Math.ceil((fechaVencimiento - fechaActual) / (1000 * 60 * 60 * 24))

        console.log(
          `- Usuario: ${usuario.nombreUsuario}, Último cambio: ${usuario.ultimoCambioContrasena.toISOString()}, Días restantes: ${diasRestantes}`,
        )
      })

      // Verificar si ya se enviaron notificaciones hoy para estos usuarios
      for (const usuario of usuariosANotificar) {
        // Verificar si ya existe una notificación similar enviada hoy
        const notificacionExistente = await prisma.notificacion.findFirst({
          where: {
            usuarioDestino: usuario.idUsuario,
            mensaje: {
              contains: "Tu contraseña vencerá en",
            },
            fechaEnvio: {
              gte: new Date(fechaActual.setHours(0, 0, 0, 0)),
              lt: new Date(fechaActual.setHours(23, 59, 59, 999)),
            },
            deletedAt: null,
          },
        })

        if (!notificacionExistente) {
          // Calcular días restantes
          const fechaVencimiento = new Date(usuario.ultimoCambioContrasena)
          fechaVencimiento.setDate(fechaVencimiento.getDate() + DIAS_VENCIMIENTO)

          const diasRestantes = Math.ceil((fechaVencimiento - fechaActual) / (1000 * 60 * 60 * 24))

          // Crear notificación
          await prisma.notificacion.create({
            data: {
              mensaje: `Tu contraseña vencerá en ${diasRestantes} días. Por favor, cámbiala para evitar el bloqueo de tu cuenta.`,
              fechaEnvio: fechaActual,
              usuarioDestino: usuario.idUsuario,
              leido: false,
            },
          })

          console.log(`Notificación enviada al usuario ${usuario.nombreUsuario}`)
        } else {
          console.log(`Ya existe una notificación para el usuario ${usuario.nombreUsuario} enviada hoy`)
        }
      }

      return usuariosANotificar.length
    } catch (error) {
      console.error("Error al notificar usuarios con contraseña próxima a vencer:", error)
      throw error
    }
  }

  /**
   * Actualiza la fecha de último cambio de contraseña para un usuario
   */
  async actualizarFechaUltimoCambioContrasena(idUsuario) {
    try {
      await prisma.usuario.update({
        where: {
          idUsuario: idUsuario,
        },
        data: {
          ultimoCambioContrasena: new Date(),
          updatedAt: new Date(),
        },
      })

      console.log(`Fecha de último cambio de contraseña actualizada para el usuario ${idUsuario}`)
      return true
    } catch (error) {
      console.error("Error al actualizar fecha de último cambio de contraseña:", error)
      throw error
    }
  }
}

export default PasswordExpirationService


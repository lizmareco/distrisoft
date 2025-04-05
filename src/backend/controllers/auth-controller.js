// Importaciones necesarias
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
// Eliminar esta línea:
// import { auditarAutenticacion } from "@/src/middleware/auth-audit"

// Importar el servicio de vencimiento de contraseñas
import PasswordExpirationService from "../services/password-expiration-service"

// Importar el servicio de auditoría
import AuditoriaService from "../services/auditoria-service"

// En la parte superior del archivo, añade esta verificación
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_TOKEN) {
  console.error("ERROR: JWT_SECRET y/o JWT_REFRESH_TOKEN no están definidos en las variables de entorno")
}

const prisma = new PrismaClient()
// Constantes para la configuración de intentos fallidos
const MAX_INTENTOS_FALLIDOS = 3
const TIEMPO_VENTANA_INTENTOS = 30 * 60 * 1000 // 30 minutos en milisegundos
const PREFIJO_INTENTO_FALLIDO = "FAILED_LOGIN_" // Prefijo para identificar intentos fallidos

class AuthController {
  // Constructor para asegurar que 'this' esté correctamente vinculado
  constructor() {
    // Vincular explícitamente los métodos al contexto 'this'
    this.login = this.login.bind(this)
    this.obtenerIntentosFallidos = this.obtenerIntentosFallidos.bind(this)
    this.registrarIntentoFallido = this.registrarIntentoFallido.bind(this)
    this.limpiarIntentosFallidos = this.limpiarIntentosFallidos.bind(this)
    this.bloquearCuenta = this.bloquearCuenta.bind(this)
    this.desbloquearCuenta = this.desbloquearCuenta.bind(this)
    this.refreshAccessToken = this.refreshAccessToken.bind(this)
    this.invalidarRefreshToken = this.invalidarRefreshToken.bind(this)
    this.invalidarAccessToken = this.invalidarAccessToken.bind(this)
    this.getUserFromToken = this.getUserFromToken.bind(this)
    this.hasAccessToken = this.hasAccessToken.bind(this)
    this.obtenerIP = this.obtenerIP.bind(this)
    this.obtenerInfoNavegador = this.obtenerInfoNavegador.bind(this)

    this.passwordExpirationService = new PasswordExpirationService()

    // Inicializar el servicio de auditoría
    this.auditoriaService = new AuditoriaService()

    // Vincular nuevos métodos
    this.cambiarContrasena = this.cambiarContrasena.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
  }

  // Método para obtener la IP del cliente
  obtenerIP(request) {
    return this.auditoriaService.obtenerDireccionIP(request)
  }

  // Método para obtener información del navegador
  obtenerInfoNavegador(request) {
    return this.auditoriaService.obtenerInfoNavegador(request)
  }

  // Verificar si hay un token de acceso válido en la solicitud
  async hasAccessToken(request) {
    try {
      // Obtener el token de las cookies
      const accessToken = request.cookies.get("at")?.value

      if (!accessToken) {
        return null
      }

      // Verificar el token
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)

        // Verificar si el token existe en la base de datos y es válido
        const tokenRecord = await prisma.accessToken.findFirst({
          where: {
            accessToken: accessToken,
            deletedAt: null,
          },
        })

        if (!tokenRecord) {
          return null
        }

        return accessToken
      } catch (error) {
        // Si el token no es válido o está expirado
        return null
      }
    } catch (error) {
      console.error("Error al verificar el token de acceso:", error)
      return null
    }
  }

  // Método login modificado para manejar correctamente usuarios con contraseña vencida
  async login(loginForm, request) {
    const { nombreUsuario, contrasena } = loginForm

    try {
      // Buscar el usuario directamente por nombreUsuario
      const usuario = await prisma.usuario.findFirst({
        where: {
          nombreUsuario: nombreUsuario,
          deletedAt: null,
        },
        include: {
          rol: true,
          persona: true,
        },
      })

      if (!usuario) {
        // En el método login, cuando el usuario no se encuentra, eliminar:
        // Registrar intento fallido en auditoría (usuario no encontrado)
        // await auditarAutenticacion(request, null, "LOGIN_FALLIDO", {
        //   razon: "Usuario no encontrado",
        //   nombreUsuario: nombreUsuario,
        //   ip: this.obtenerIP(request),
        //   navegador: this.obtenerInfoNavegador(request),
        // });

        // También registrar con el nuevo servicio
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: "0",
          accion: "LOGIN_FALLIDO",
          valorAnterior: null,
          valorNuevo: {
            razon: "Usuario no encontrado",
            nombreUsuario: nombreUsuario,
          },
          idUsuario: 0,
          request,
        })

        // Si no encontramos el usuario, devolvemos un error genérico
        throw new Error("Usuario o contraseña incorrecta")
      }

      // Verificar el estado del usuario ANTES de verificar la contraseña
      // Verificar si la cuenta está bloqueada
      if (usuario.estado === "BLOQUEADO") {
        // En el método login, cuando la cuenta está bloqueada, eliminar:
        // Registrar intento de login en cuenta bloqueada
        // await auditarAutenticacion(request, usuario.idUsuario, "LOGIN_CUENTA_BLOQUEADA", {
        //   nombreUsuario: usuario.nombreUsuario,
        //   ip: this.obtenerIP(request),
        //   navegador: this.obtenerInfoNavegador(request),
        // });

        // También registrar con el nuevo servicio
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: usuario.idUsuario,
          accion: "LOGIN_CUENTA_BLOQUEADA",
          valorAnterior: null,
          valorNuevo: {
            nombreUsuario: usuario.nombreUsuario,
          },
          idUsuario: usuario.idUsuario,
          request,
        })

        throw new Error("Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador.")
      }

      // Si la cuenta tiene contraseña vencida, permitir el inicio de sesión pero marcar como vencida
      if (usuario.estado === "VENCIDO") {
        console.log("Usuario con contraseña vencida:", usuario.nombreUsuario)

        // Verificar la contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena)

        if (!contrasenaValida) {
          // Obtener los intentos fallidos recientes
          const ultimosIntentosFallidos = await this.obtenerIntentosFallidos(usuario.idUsuario)
          const totalIntentosFallidos = ultimosIntentosFallidos.length + 1 // +1 por el intento actual

          // Registrar este intento fallido
          await this.registrarIntentoFallido(usuario.idUsuario)

          // En el método login, cuando la contraseña es incorrecta (cuenta vencida), eliminar:
          // Registrar intento fallido en auditoría
          // await auditarAutenticacion(request, usuario.idUsuario, "LOGIN_FALLIDO", {
          //   razon: "Contraseña incorrecta (cuenta vencida)",
          //   intentosFallidos: totalIntentosFallidos,
          //   ip: this.obtenerIP(request),
          //   navegador: this.obtenerInfoNavegador(request),
          // });

          // También registrar con el nuevo servicio
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: usuario.idUsuario,
            accion: "LOGIN_FALLIDO",
            valorAnterior: null,
            valorNuevo: {
              razon: "Contraseña incorrecta (cuenta vencida)",
              intentosFallidos: totalIntentosFallidos,
            },
            idUsuario: usuario.idUsuario,
            request,
          })

          // Si alcanzamos el máximo de intentos, bloqueamos la cuenta
          if (totalIntentosFallidos >= MAX_INTENTOS_FALLIDOS) {
            await this.bloquearCuenta(usuario.idUsuario)

            // En el método login, cuando se bloquea la cuenta, eliminar:
            // Registrar bloqueo de cuenta en auditoría
            // await auditarAutenticacion(request, usuario.idUsuario, "CUENTA_BLOQUEADA", {
            //   razon: "Múltiples intentos fallidos",
            //   intentosFallidos: totalIntentosFallidos,
            //   ip: this.obtenerIP(request),
            //   navegador: this.obtenerInfoNavegador(request),
            // });

            // También registrar con el nuevo servicio
            await this.auditoriaService.registrarAuditoria({
              entidad: "Usuario",
              idRegistro: usuario.idUsuario,
              accion: "CUENTA_BLOQUEADA",
              valorAnterior: { estado: "VENCIDO" },
              valorNuevo: {
                estado: "BLOQUEADO",
                razon: "Múltiples intentos fallidos",
                intentosFallidos: totalIntentosFallidos,
              },
              idUsuario: usuario.idUsuario,
              request,
            })

            throw new Error("Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador.")
          }

          // Si no, devolvemos un error con la cantidad de intentos restantes
          const intentosRestantes = MAX_INTENTOS_FALLIDOS - totalIntentosFallidos
          throw new Error(
            `Usuario o contraseña incorrecta. Te quedan ${intentosRestantes} ${
              intentosRestantes === 1 ? "intento" : "intentos"
            }.`,
          )
        }

        // En el método login, cuando la contraseña es correcta (cuenta vencida), eliminar:
        // Si la contraseña es correcta, registrar login con contraseña vencida
        // await auditarAutenticacion(request, usuario.idUsuario, "LOGIN_CONTRASEÑA_VENCIDA", {
        //   nombreUsuario: usuario.nombreUsuario,
        //   ip: this.obtenerIP(request),
        //   navegador: this.obtenerInfoNavegador(request),
        //   rol: usuario.rol.nombreRol,
        // });

        // También registrar con el nuevo servicio
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: usuario.idUsuario,
          accion: "LOGIN_CONTRASEÑA_VENCIDA",
          valorAnterior: null,
          valorNuevo: {
            nombreUsuario: usuario.nombreUsuario,
            rol: usuario.rol.nombreRol,
          },
          idUsuario: usuario.idUsuario,
          request,
        })

        // Si la contraseña es correcta, generar tokens pero marcar la cuenta como vencida
        return await this.generarTokens(usuario, true)
      }

      // Para usuarios con estado ACTIVO, verificar la contraseña normalmente
      const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena)

      if (!contrasenaValida) {
        // Obtener los intentos fallidos recientes
        const ultimosIntentosFallidos = await this.obtenerIntentosFallidos(usuario.idUsuario)
        const totalIntentosFallidos = ultimosIntentosFallidos.length + 1 // +1 por el intento actual

        // Registrar este intento fallido
        await this.registrarIntentoFallido(usuario.idUsuario)

        // En el método login, para usuarios con estado ACTIVO, cuando la contraseña es incorrecta, eliminar:
        // Registrar intento fallido en auditoría
        // await auditarAutenticacion(request, usuario.idUsuario, "LOGIN_FALLIDO", {
        //   razon: "Contraseña incorrecta",
        //   intentosFallidos: totalIntentosFallidos,
        //   ip: this.obtenerIP(request),
        //   navegador: this.obtenerInfoNavegador(request),
        // });

        // También registrar con el nuevo servicio
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: usuario.idUsuario,
          accion: "LOGIN_FALLIDO",
          valorAnterior: null,
          valorNuevo: {
            razon: "Contraseña incorrecta",
            intentosFallidos: totalIntentosFallidos,
          },
          idUsuario: usuario.idUsuario,
          request,
        })

        // Si alcanzamos el máximo de intentos, bloqueamos la cuenta
        if (totalIntentosFallidos >= MAX_INTENTOS_FALLIDOS) {
          await this.bloquearCuenta(usuario.idUsuario)

          // En el método login, cuando se bloquea la cuenta (usuario ACTIVO), eliminar:
          // Registrar bloqueo de cuenta en auditoría
          // await auditarAutenticacion(request, usuario.idUsuario, "CUENTA_BLOQUEADA", {
          //   razon: "Múltiples intentos fallidos",
          //   intentosFallidos: totalIntentosFallidos,
          //   ip: this.obtenerIP(request),
          //   navegador: this.obtenerInfoNavegador(request),
          // });

          // También registrar con el nuevo servicio
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: usuario.idUsuario,
            accion: "CUENTA_BLOQUEADA",
            valorAnterior: { estado: "ACTIVO" },
            valorNuevo: {
              estado: "BLOQUEADO",
              razon: "Múltiples intentos fallidos",
              intentosFallidos: totalIntentosFallidos,
            },
            idUsuario: usuario.idUsuario,
            request,
          })

          throw new Error("Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador.")
        }

        // Si no, devolvemos un error con la cantidad de intentos restantes
        const intentosRestantes = MAX_INTENTOS_FALLIDOS - totalIntentosFallidos
        throw new Error(
          `Usuario o contraseña incorrecta. Te quedan ${intentosRestantes} ${
            intentosRestantes === 1 ? "intento" : "intentos"
          }.`,
        )
      }

      // Si la contraseña es correcta, reiniciamos los intentos fallidos
      await this.limpiarIntentosFallidos(usuario.idUsuario)

      // Registrar login exitoso en auditoría
      await this.auditoriaService.registrarAuditoria({
        entidad: "Usuario",
        idRegistro: usuario.idUsuario,
        accion: "LOGIN_EXITOSO",
        valorAnterior: null,
        valorNuevo: {
          nombreUsuario: usuario.nombreUsuario,
          rol: usuario.rol.nombreRol,
        },
        idUsuario: usuario.idUsuario,
        request,
      })

      // Generar tokens para usuario normal (no vencido)
      return await this.generarTokens(usuario, false)
    } catch (error) {
      console.error("Error en login:", error)
      throw error
    }
  }

  // Método para generar tokens (extraído para evitar duplicación de código)
  async generarTokens(usuario, cuentaVencida) {
    try {
      // Verificar que las claves secretas estén definidas
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_TOKEN) {
        throw new Error("Error de configuración del servidor: Claves JWT no definidas")
      }

      // Verificar que el rol exista
      if (!usuario.rol) {
        console.error("Error: El usuario no tiene un rol asignado o no se pudo cargar el rol", {
          idUsuario: usuario.idUsuario,
          idRol: usuario.idRol,
        })

        // Intentar cargar el rol directamente
        const rol = await prisma.rol.findUnique({
          where: {
            idRol: usuario.idRol,
          },
        })

        if (!rol) {
          throw new Error("Error de configuración: No se pudo determinar el rol del usuario")
        }

        // Asignar el rol manualmente
        usuario.rol = rol
      }

      // Obtener los permisos del usuario según su rol
      const permisos = await prisma.rolPermiso.findMany({
        where: {
          idRol: usuario.idRol,
          deletedAt: null,
        },
        include: {
          permiso: {
            select: {
              nombrePermiso: true,
            },
          },
        },
      })

      // Extraer solo los nombres de los permisos
      const permisosArray = permisos
        .filter((rp) => rp.permiso) // Asegurarse de que el permiso existe
        .map((rp) => rp.permiso.nombrePermiso)

      console.log("Permisos del usuario:", permisosArray)

      // Crear el payload del JWT con la estructura adecuada
      // Incluir directamente los datos del usuario en el payload principal
      const payload = {
        idUsuario: usuario.idUsuario,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        correo: usuario.persona.correoPersona,
        rol: usuario.rol.nombreRol,
        usuario: usuario.nombreUsuario,
        permisos: permisosArray,
      }

      console.log("Payload del token:", payload)

      // Generar tokens con la estructura adecuada
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
        algorithm: "HS256", // Especificar el algoritmo
      })

      const refreshToken = jwt.sign({ idUsuario: usuario.idUsuario }, process.env.JWT_REFRESH_TOKEN, {
        expiresIn: "7d",
        algorithm: "HS256", // Especificar el algoritmo
      })

      // Primero, guardar el token de acceso
      const accessTokenRecord = await prisma.accessToken.create({
        data: {
          accessToken: accessToken,
          idUsuario: usuario.idUsuario,
        },
      })

      // Luego, guardar el token de refresco vinculado al token de acceso
      await prisma.refreshToken.create({
        data: {
          refreshToken: refreshToken,
          idUsuario: usuario.idUsuario,
          idAccessToken: accessTokenRecord.idAccessToken, // Vinculamos con el AccessToken recién creado
        },
      })

      // Devolver tokens y datos del usuario
      return {
        accessToken,
        refreshToken,
        cuentaVencida,
      }
    } catch (error) {
      console.error("Error al generar tokens:", error)
      throw error
    }
  }

  // Métodos para manejar intentos fallidos usando la convención de prefijos
  async obtenerIntentosFallidos(idUsuario) {
    // Obtener los intentos fallidos en la ventana de tiempo definida
    const tiempoLimite = new Date(Date.now() - TIEMPO_VENTANA_INTENTOS)

    return await prisma.accessToken.findMany({
      where: {
        idUsuario: idUsuario,
        accessToken: {
          startsWith: PREFIJO_INTENTO_FALLIDO,
        },
        createdAt: {
          gte: tiempoLimite,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  async registrarIntentoFallido(idUsuario) {
    // Generamos un token único para el intento fallido
    const failedToken = `${PREFIJO_INTENTO_FALLIDO}${idUsuario}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    return await prisma.accessToken.create({
      data: {
        accessToken: failedToken,
        idUsuario: idUsuario,
      },
    })
  }

  async limpiarIntentosFallidos(idUsuario) {
    // Marcar como eliminados los intentos fallidos cuando el login es exitoso
    const tiempoLimite = new Date(Date.now() - TIEMPO_VENTANA_INTENTOS)

    return await prisma.accessToken.updateMany({
      where: {
        idUsuario: idUsuario,
        accessToken: {
          startsWith: PREFIJO_INTENTO_FALLIDO,
        },
        createdAt: {
          gte: tiempoLimite,
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  async bloquearCuenta(idUsuario) {
    // Bloquear la cuenta del usuario
    return await prisma.usuario.update({
      where: {
        idUsuario: idUsuario,
      },
      data: {
        estado: "BLOQUEADO",
        updatedAt: new Date(),
      },
    })
  }

  // Método para desbloquear cuenta (para administradores)
  async desbloquearCuenta(idUsuario, request) {
    // Desbloquear la cuenta y limpiar los intentos fallidos
    await this.limpiarIntentosFallidos(idUsuario)

    // Registrar desbloqueo en auditoría
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario },
      include: { persona: true },
    })

    if (usuario) {
      // En el método desbloquearCuenta, eliminar:
      // Registrar desbloqueo en auditoría
      // await auditarAutenticacion(request, idUsuario, "CUENTA_DESBLOQUEADA", {
      //   nombreUsuario: usuario.nombreUsuario,
      //   ip: this.obtenerIP(request),
      //   navegador: this.obtenerInfoNavegador(request),
      //   administrador: request ? await this.getUserFromToken(await this.hasAccessToken(request)) : null,
      // });

      // También registrar con el nuevo servicio
      await this.auditoriaService.registrarAuditoria({
        entidad: "Usuario",
        idRegistro: idUsuario,
        accion: "CUENTA_DESBLOQUEADA",
        valorAnterior: { estado: "BLOQUEADO" },
        valorNuevo: {
          estado: "ACTIVO",
          nombreUsuario: usuario.nombreUsuario,
          administrador: request ? await this.getUserFromToken(await this.hasAccessToken(request)) : null,
        },
        idUsuario: idUsuario,
        request,
      })
    }

    return await prisma.usuario.update({
      where: {
        idUsuario: idUsuario,
      },
      data: {
        estado: "ACTIVO",
        updatedAt: new Date(),
      },
    })
  }

  async refreshAccessToken(refreshToken, request) {
    try {
      // Verificar que la clave secreta esté definida
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_TOKEN) {
        throw new Error("Error de configuración del servidor: Claves JWT no definidas")
      }

      // Buscar el token de refresco en la base de datos
      const tokenRecord = await prisma.refreshToken.findFirst({
        where: {
          refreshToken: refreshToken,
          deletedAt: null,
        },
        include: {
          usuario: {
            include: {
              persona: true,
              rol: true,
            },
          },
        },
      })

      if (!tokenRecord) {
        // Eliminar todas las llamadas a auditarAutenticacion
        // Registrar intento de refresh con token inválido
        // if (request) {
        //   await auditarAutenticacion(request, null, "REFRESH_TOKEN_INVALIDO", {
        //     ip: this.obtenerIP(request),
        //     navegador: this.obtenerInfoNavegador(request),
        //   });

        // También registrar con el nuevo servicio
        if (request) {
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: "0",
            accion: "REFRESH_TOKEN_INVALIDO",
            valorAnterior: null,
            valorNuevo: null,
            idUsuario: 0,
            request,
          })
        }
        return null
      }

      // Verificar el token
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN)

        // Verificar que el ID del usuario coincida
        if (decoded.idUsuario !== tokenRecord.idUsuario) {
          // Eliminar todas las llamadas a auditarAutenticacion
          // Registrar intento de refresh con token manipulado
          // if (request) {
          //   await auditarAutenticacion(request, tokenRecord.idUsuario, "REFRESH_TOKEN_MANIPULADO", {
          //     ip: this.obtenerIP(request),
          //     navegador: this.obtenerInfoNavegador(request),
          //   });

          // También registrar con el nuevo servicio
          if (request) {
            await this.auditoriaService.registrarAuditoria({
              entidad: "Usuario",
              idRegistro: tokenRecord.idUsuario,
              accion: "REFRESH_TOKEN_MANIPULADO",
              valorAnterior: null,
              valorNuevo: null,
              idUsuario: tokenRecord.idUsuario,
              request,
            })
          }
          return null
        }
      } catch (error) {
        // Si el token no es válido o está expirado
        await this.invalidarRefreshToken(refreshToken)

        // Eliminar todas las llamadas a auditarAutenticacion
        // Registrar intento de refresh con token expirado
        // if (request) {
        //   await auditarAutenticacion(request, tokenRecord.idUsuario, "REFRESH_TOKEN_EXPIRADO", {
        //     ip: this.obtenerIP(request),
        //     navegador: this.obtenerInfoNavegador(request),
        //   });

        // También registrar con el nuevo servicio
        if (request) {
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: tokenRecord.idUsuario,
            accion: "REFRESH_TOKEN_EXPIRADO",
            valorAnterior: null,
            valorNuevo: null,
            idUsuario: tokenRecord.idUsuario,
            request,
          })
        }
        return null
      }

      const usuario = tokenRecord.usuario

      // Obtener los permisos del usuario según su rol
      const permisos = await prisma.rolPermiso.findMany({
        where: {
          idRol: usuario.idRol,
          deletedAt: null,
        },
        include: {
          permiso: {
            select: {
              nombrePermiso: true,
            },
          },
        },
      })

      // Extraer solo los nombres de los permisos
      const permisosArray = permisos.filter((rp) => rp.permiso).map((rp) => rp.permiso.nombrePermiso)

      // Crear el payload del JWT con la estructura adecuada
      // Incluir directamente los datos del usuario en el payload principal
      const payload = {
        idUsuario: usuario.idUsuario,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        correo: usuario.persona.correoPersona,
        rol: usuario.rol.nombreRol,
        usuario: usuario.nombreUsuario,
        permisos: permisosArray,
      }

      // Generar nuevos tokens
      const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_SECRET_EXPIRE || "30m",
        algorithm: "HS256",
      })

      const newRefreshToken = jwt.sign({ idUsuario: usuario.idUsuario }, process.env.JWT_REFRESH_TOKEN, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE || "15d",
        algorithm: "HS256",
      })

      // Invalidar el token de refresco anterior
      await this.invalidarRefreshToken(refreshToken)

      // Primero, crear el nuevo AccessToken
      const accessTokenRecord = await prisma.accessToken.create({
        data: {
          accessToken: newAccessToken,
          idUsuario: usuario.idUsuario,
        },
      })

      // Luego, crear el nuevo RefreshToken vinculado al AccessToken
      await prisma.refreshToken.create({
        data: {
          refreshToken: newRefreshToken,
          idUsuario: usuario.idUsuario,
          idAccessToken: accessTokenRecord.idAccessToken,
        },
      })

      // Eliminar todas las llamadas a auditarAutenticacion
      // Registrar refresh token exitoso
      // if (request) {
      //   await auditarAutenticacion(request, usuario.idUsuario, "REFRESH_TOKEN_EXITOSO", {
      //     ip: this.obtenerIP(request),
      //     navegador: this.obtenerInfoNavegador(request),
      //   });

      // También registrar con el nuevo servicio
      if (request) {
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: usuario.idUsuario,
          accion: "REFRESH_TOKEN_EXITOSO",
          valorAnterior: null,
          valorNuevo: null,
          idUsuario: usuario.idUsuario,
          request,
        })
      }

      // Devolver tokens sin objeto userData separado
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      console.error("Error al refrescar el token:", error)
      return null
    }
  }

  async invalidarRefreshToken(token) {
    return await prisma.refreshToken.updateMany({
      where: {
        refreshToken: token,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  async invalidarAccessToken(token) {
    return await prisma.accessToken.updateMany({
      where: {
        accessToken: token,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  // Método para obtener los datos del usuario a partir del token
  async getUserFromToken(token) {
    try {
      // Verificar que la clave secreta esté definida
      if (!process.env.JWT_SECRET) {
        throw new Error("Error de configuración del servidor: Clave JWT no definida")
      }

      // Decodificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Extraer los datos directamente del token
      return {
        idUsuario: decoded.idUsuario,
        nombre: decoded.nombre,
        apellido: decoded.apellido,
        correo: decoded.correo,
        rol: decoded.rol,
        usuario: decoded.usuario,
        permisos: decoded.permisos || [],
      }
    } catch (error) {
      console.error("Error al obtener usuario desde token:", error)
      return null
    }
  }

  // Método para cambiar contraseña
  async cambiarContrasena(idUsuario, contrasenaActual, nuevaContrasena, request) {
    try {
      // Buscar el usuario
      const usuario = await prisma.usuario.findUnique({
        where: {
          idUsuario: idUsuario,
          deletedAt: null,
        },
      })

      if (!usuario) {
        // Eliminar todas las llamadas a auditarAutenticacion
        // Registrar intento fallido de cambio de contraseña
        // if (request) {
        //   await auditarAutenticacion(request, idUsuario, "CAMBIO_CONTRASEÑA_FALLIDO", {
        //     razon: "Usuario no encontrado",
        //     ip: this.obtenerIP(request),
        //     navegador: this.obtenerInfoNavegador(request),
        //   });

        // También registrar con el nuevo servicio
        if (request) {
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: idUsuario,
            accion: "CAMBIO_CONTRASEÑA_FALLIDO",
            valorAnterior: null,
            valorNuevo: {
              razon: "Usuario no encontrado",
            },
            idUsuario: idUsuario,
            request,
          })
        }
        throw new Error("Usuario no encontrado")
      }

      // Verificar la contraseña actual
      const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena)

      if (!contrasenaValida) {
        // Eliminar todas las llamadas a auditarAutenticacion
        // Registrar intento fallido de cambio de contraseña
        // if (request) {
        //   await auditarAutenticacion(request, idUsuario, "CAMBIO_CONTRASEÑA_FALLIDO", {
        //     razon: "Contraseña actual incorrecta",
        //     ip: this.obtenerIP(request),
        //     navegador: this.obtenerInfoNavegador(request),
        //   });

        // También registrar con el nuevo servicio
        if (request) {
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: idUsuario,
            accion: "CAMBIO_CONTRASEÑA_FALLIDO",
            valorAnterior: null,
            valorNuevo: {
              razon: "Contraseña actual incorrecta",
            },
            idUsuario: idUsuario,
            request,
          })
        }
        throw new Error("La contraseña actual es incorrecta")
      }

      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10)

      // Actualizar la contraseña y la fecha de último cambio
      await prisma.usuario.update({
        where: {
          idUsuario: idUsuario,
        },
        data: {
          contrasena: hashedPassword,
          ultimoCambioContrasena: new Date(),
          updatedAt: new Date(),
        },
      })

      // Eliminar todas las llamadas a auditarAutenticacion
      // Registrar cambio de contraseña exitoso
      // if (request) {
      //   await auditarAutenticacion(request, idUsuario, "CAMBIO_CONTRASEÑA_EXITOSO", {
      //     ip: this.obtenerIP(request),
      //     navegador: this.obtenerInfoNavegador(request),
      //     forzado: false,
      //   });

      // También registrar con el nuevo servicio
      if (request) {
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: idUsuario,
          accion: "CAMBIO_CONTRASEÑA_EXITOSO",
          valorAnterior: null,
          valorNuevo: {
            forzado: false,
          },
          idUsuario: idUsuario,
          request,
        })
      }

      return true
    } catch (error) {
      console.error("Error al cambiar contraseña:", error)
      throw error
    }
  }

  // Modificar el método de reset de contraseña existente para actualizar la fecha
  async resetPassword(idUsuario, nuevaContrasena, request, adminId = null) {
    try {
      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10)

      // Obtener el usuario actual para verificar su estado
      const usuario = await prisma.usuario.findUnique({
        where: {
          idUsuario: idUsuario,
        },
      })

      if (!usuario) {
        // Eliminar todas las llamadas a auditarAutenticacion
        // Registrar intento fallido de reset de contraseña
        // if (request) {
        //   await auditarAutenticacion(request, null, "RESET_CONTRASEÑA_FALLIDO", {
        //     razon: "Usuario no encontrado",
        //     idUsuarioObjetivo: idUsuario,
        //     ip: this.obtenerIP(request),
        //     navegador: this.obtenerInfoNavegador(request),
        //     adminId,
        //   });

        // También registrar con el nuevo servicio
        if (request) {
          await this.auditoriaService.registrarAuditoria({
            entidad: "Usuario",
            idRegistro: idUsuario,
            accion: "RESET_CONTRASEÑA_FALLIDO",
            valorAnterior: null,
            valorNuevo: {
              razon: "Usuario no encontrado",
              adminId,
            },
            idUsuario: adminId || 0,
            request,
          })
        }
        throw new Error("Usuario no encontrado")
      }

      // Actualizar la contraseña y la fecha de último cambio
      await prisma.usuario.update({
        where: {
          idUsuario: idUsuario,
        },
        data: {
          contrasena: hashedPassword,
          ultimoCambioContrasena: new Date(),
          updatedAt: new Date(),
          // Si el usuario estaba bloqueado por contraseña vencida, activarlo
          estado: usuario.estado === "VENCIDO" ? "ACTIVO" : usuario.estado,
        },
      })

      // Eliminar todas las llamadas a auditarAutenticacion
      // Registrar reset de contraseña exitoso
      // if (request) {
      //   await auditarAutenticacion(request, idUsuario, "RESET_CONTRASEÑA_EXITOSO", {
      //     ip: this.obtenerIP(request),
      //     navegador: this.obtenerInfoNavegador(request),
      //     estadoAnterior: usuario.estado,
      //     adminId,
      //   });

      // También registrar con el nuevo servicio
      if (request) {
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: idUsuario,
          accion: "RESET_CONTRASEÑA_EXITOSO",
          valorAnterior: {
            estado: usuario.estado,
          },
          valorNuevo: {
            estado: usuario.estado === "VENCIDO" ? "ACTIVO" : usuario.estado,
            adminId,
          },
          idUsuario: adminId || idUsuario,
          request,
        })
      }

      return true
    } catch (error) {
      console.error("Error al restablecer contraseña:", error)
      throw error
    }
  }

  // Método para cerrar sesión
  async logout(request, accessToken) {
    try {
      // Obtener el usuario del token
      const userData = await this.getUserFromToken(accessToken)

      // Invalidar el token
      await this.invalidarAccessToken(accessToken)

      // Eliminar:
      // Registrar logout en auditoría
      // if (userData && request) {
      //   await auditarAutenticacion(request, userData.idUsuario, "LOGOUT", {
      //     ip: this.obtenerIP(request),
      //     navegador: this.obtenerInfoNavegador(request),
      //   });

      // También registrar con el nuevo servicio
      if (userData && request) {
        await this.auditoriaService.registrarAuditoria({
          entidad: "Usuario",
          idRegistro: userData.idUsuario,
          accion: "LOGOUT",
          valorAnterior: null,
          valorNuevo: null,
          idUsuario: userData.idUsuario,
          request,
        })
      }

      return true
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }
}

export default AuthController


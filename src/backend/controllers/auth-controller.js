// Importaciones existentes...
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
// Otras importaciones...

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
  }

  async hasAccessToken(request) {
    // Tu implementación existente...
  }

  // Método login modificado para usar nombreUsuario en lugar de correo
  async login(loginForm) {
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
        // Si no encontramos el usuario, devolvemos un error genérico
        throw new Error("Usuario o contraseña incorrecta")
      }

      // Verificar si la cuenta está bloqueada
      if (usuario.estado === "BLOQUEADO") {
        throw new Error("Tu cuenta ha sido bloqueada por múltiples intentos fallidos. Contacta al administrador.")
      }

      // Verificar la contraseña
      const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena)

      if (!contrasenaValida) {
        // Obtener los intentos fallidos recientes
        const ultimosIntentosFallidos = await this.obtenerIntentosFallidos(usuario.idUsuario)
        const totalIntentosFallidos = ultimosIntentosFallidos.length + 1 // +1 por el intento actual

        // Registrar este intento fallido
        await this.registrarIntentoFallido(usuario.idUsuario)

        // Si alcanzamos el máximo de intentos, bloqueamos la cuenta
        if (totalIntentosFallidos >= MAX_INTENTOS_FALLIDOS) {
          await this.bloquearCuenta(usuario.idUsuario)
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

      // Crear un objeto con los datos del usuario para devolver al cliente
      const userData = {
        id: usuario.idUsuario,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        correo: usuario.persona.correoPersona,
        rol: usuario.rol.nombreRol, // Usar nombreRol en lugar de nombre
        usuario: usuario.nombreUsuario,
      }

      console.log("Datos del usuario para el token:", userData)

      // Generar tokens (tu implementación existente)
      const accessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: "1h" })

      const refreshToken = jwt.sign({ id: usuario.idUsuario }, process.env.JWT_REFRESH_TOKEN, { expiresIn: "7d" })

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
        user: userData,
      }
    } catch (error) {
      console.error("Error en login:", error)
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
  async desbloquearCuenta(idUsuario) {
    // Desbloquear la cuenta y limpiar los intentos fallidos
    await this.limpiarIntentosFallidos(idUsuario)

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

  async refreshAccessToken(refreshToken) {
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
        return null
      }

      // Verificar el token
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN)

        // Verificar que el ID del usuario coincida
        if (decoded.id !== tokenRecord.idUsuario) {
          return null
        }
      } catch (error) {
        // Si el token no es válido o está expirado
        await this.invalidarRefreshToken(refreshToken)
        return null
      }

      const usuario = tokenRecord.usuario

      // Crear un objeto con los datos del usuario
      const userData = {
        id: usuario.idUsuario,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        correo: usuario.persona.correoPersona,
        rol: usuario.rol.nombre,
        usuario: usuario.nombreUsuario,
      }

      // Generar nuevos tokens
      const newAccessToken = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_SECRET_EXPIRE || "30m",
      })

      const newRefreshToken = jwt.sign({ id: usuario.idUsuario }, process.env.JWT_REFRESH_TOKEN, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE || "15d",
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

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: userData,
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
}

export default AuthController


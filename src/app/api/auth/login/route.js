import { NextResponse } from "next/server"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import { prisma } from "@/prisma/client"

// Importamos las constantes desde settings.js
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/settings"

export async function POST(request) {
  try {
    console.log("API login: Recibiendo solicitud")

    const authController = new AuthController()
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      console.log("API login: Usuario ya tiene sesión activa")
      return NextResponse.json({ accessToken, message: "Ya has iniciado sesión" }, { status: HTTP_STATUS_CODES.ok })
    }

    // Clonar la solicitud para poder leer el cuerpo múltiples veces
    const requestClone = request.clone()
    const loginForm = await request.json()
    console.log("API login: Datos recibidos", { nombreUsuario: loginForm.nombreUsuario })

    // Añadir logs para depuración de headers
    console.log("Headers de la solicitud:", {
      userAgent: request.headers.get("user-agent"),
      forwardedFor: request.headers.get("x-forwarded-for"),
      realIp: request.headers.get("x-real-ip"),
      cfConnectingIp: request.headers.get("cf-connecting-ip"),
    })

    try {
      console.log("API login: Intentando autenticar usuario")
      // Pasar la solicitud completa al método login
      const result = await authController.login(loginForm, requestClone)

      if (!result || !result.accessToken) {
        console.log("API login: Autenticación fallida - No se generaron tokens")
        return NextResponse.json(
          { message: "¡Usuario o contraseña incorrecta!" },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Resto del código existente...
      const { accessToken, refreshToken, cuentaVencida, user } = result
      console.log("API login: Autenticación exitosa", cuentaVencida ? "- Cuenta con contraseña vencida" : "")

      // Decodificar el token para obtener los datos del usuario
      const userData = await authController.getUserFromToken(accessToken)
      console.log("API login: Datos del usuario extraídos del token", userData)

      const response = NextResponse.json(
        {
          accessToken,
          cuentaVencida: cuentaVencida,
          userId: result.userId || userData.idUsuario,
          user: user || userData, // Incluir los datos del usuario completos
        },
        { status: HTTP_STATUS_CODES.ok },
      )

      response.cookies.set("at", accessToken, {
        httpOnly: true,
        maxAge: ACCESS_TOKEN_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      response.cookies.set("rt", refreshToken, {
        httpOnly: true,
        maxAge: REFRESH_TOKEN_MAX_AGE,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })

      console.log("API login: Cookies establecidas y respuesta preparada")
      return response
    } catch (error) {
      // Código existente para manejar errores...
      console.error("API login: Error específico durante autenticación:", error)
      const errorMessage = error.message || "Ha ocurrido un error"
      console.log("API login: Mensaje de error:", errorMessage)

      // Resto del código de manejo de errores...
      // [Código existente para manejar diferentes tipos de errores]

      // Verificar si es un error de cuenta bloqueada - PRIORIDAD 1
      if (errorMessage.includes("bloqueada")) {
        console.log("API login: Cuenta bloqueada detectada")
        return NextResponse.json(
          {
            message: errorMessage,
            cuentaBloqueada: true,
          },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Verificar si es un error de cuenta inactiva - PRIORIDAD 2
      if (errorMessage.includes("inactiva")) {
        console.log("API login: Cuenta inactiva detectada")
        return NextResponse.json(
          {
            message: errorMessage,
            cuentaInactiva: true,
          },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Verificar si es un error de contraseña vencida - PRIORIDAD 3
      if (errorMessage.includes("vencida") || errorMessage.includes("vencido")) {
        console.log("API login: Cuenta con contraseña vencida detectada")

        // Intentar obtener el ID del usuario si está disponible en el error
        let userId = null
        try {
          // Intentar extraer el ID del usuario del mensaje de error o del contexto
          if (loginForm && loginForm.nombreUsuario) {
            const usuario = await prisma.usuario.findFirst({
              where: {
                nombreUsuario: loginForm.nombreUsuario,
                deletedAt: null,
              },
              select: {
                idUsuario: true,
              },
            })

            if (usuario) {
              userId = usuario.idUsuario
              console.log("API login: ID de usuario recuperado:", userId)
            }
          }
        } catch (idError) {
          console.error("Error al obtener ID de usuario:", idError)
        }

        return NextResponse.json(
          {
            message: errorMessage,
            cuentaVencida: true,
            userId: userId, // Incluir el ID del usuario si está disponible
          },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Verificar si es un error de intentos restantes - PRIORIDAD 4
      if (errorMessage.includes("Te quedan")) {
        // Extraer el número de intentos restantes del mensaje
        const intentosRestantes = Number.parseInt(errorMessage.match(/Te quedan (\d+)/)[1])

        return NextResponse.json(
          {
            message: errorMessage,
            intentosRestantes,
          },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Otros errores
      return NextResponse.json({ message: errorMessage }, { status: HTTP_STATUS_CODES.forbidden })
    }
  } catch (error) {
    console.error("API login: Error general:", error)

    if (error.isCustom) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    } else {
      console.error("Error in /api/login: ", JSON.stringify(error, null, 2))
      return NextResponse.json({ message: "Ha ocurrido un error" }, { status: HTTP_STATUS_CODES.internalServerError })
    }
  }
}

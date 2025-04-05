import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/settings"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    console.log("API login: Recibiendo solicitud")

    const authController = new AuthController()
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      console.log("API login: Usuario ya tiene sesión activa")
      return NextResponse.json({ accessToken, message: "Ya has iniciado sesión" }, { status: HTTP_STATUS_CODES.ok })
    }

    const loginForm = await request.json()
    console.log("API login: Datos recibidos", { nombreUsuario: loginForm.nombreUsuario })

    try {
      console.log("API login: Intentando autenticar usuario")
      // Asegurarse de pasar el objeto request al método login
      const result = await authController.login(loginForm, request)

      if (!result || !result.accessToken) {
        console.log("API login: Autenticación fallida - No se generaron tokens")
        return NextResponse.json(
          { message: "¡Usuario o contraseña incorrecta!" },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Extraer los tokens y la información de cuenta vencida
      const { accessToken, refreshToken, cuentaVencida } = result
      console.log("API login: Autenticación exitosa", cuentaVencida ? "- Cuenta con contraseña vencida" : "")

      // Decodificar el token para obtener los datos del usuario
      const userData = await authController.getUserFromToken(accessToken)
      console.log("API login: Datos del usuario extraídos del token", userData)

      const response = NextResponse.json(
        {
          accessToken,
          cuentaVencida: cuentaVencida,
          // No incluimos user separado, ya que los datos están en el token
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
      console.error("API login: Error específico durante autenticación:", error)

      // Capturar errores específicos del login
      const errorMessage = error.message || "Ha ocurrido un error"
      console.log("API login: Mensaje de error:", errorMessage)

      // Verificar si es un error de cuenta bloqueada
      if (errorMessage.includes("bloqueada")) {
        return NextResponse.json(
          {
            message: errorMessage,
            cuentaBloqueada: true,
          },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Verificar si es un error de contraseña vencida
      if (errorMessage.includes("contraseña ha vencido")) {
        console.log("API login: Detectada cuenta con contraseña vencida")
        return NextResponse.json(
          {
            message: errorMessage,
            cuentaVencida: true,
          },
          { status: HTTP_STATUS_CODES.forbidden },
        )
      }

      // Verificar si es un error de intentos restantes
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


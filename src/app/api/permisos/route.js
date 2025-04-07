import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

// GET /api/permisos - Obtener todos los permisos
export async function GET(request) {
  try {
    console.log("API: Recibida solicitud para obtener permisos")
    const authController = new AuthController()

    // Verificar autenticación
    const accessToken = await authController.hasAccessToken(request)

    // Obtener el token del encabezado de autorización directamente
    const authHeader = request.headers.get("authorization")
    let headerToken = null
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.substring(7)
      console.log("Token encontrado en encabezado de autorización")
    }

    // Usar el token del encabezado si está disponible
    const token = headerToken || accessToken

    if (!token) {
      console.log("API roles: No se encontró token válido")

      // En desarrollo, permitir acceso sin token para pruebas
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso sin token")
        // Obtener roles con sus permisos
        const permisos = await prisma.permiso.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            nombrePermiso: "asc",
          },
        })

        console.log("API: Permisos obtenidos en modo desarrollo sin token", { cantidad: permisos.length })
        return NextResponse.json({ permisos }, { status: 200 })
      }

      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Obtener el usuario del token
    let userData = null

    try {
      userData = await authController.getUserFromToken(token)
    } catch (tokenError) {
      console.error("Error al decodificar token:", tokenError)

      // En desarrollo, permitir acceso con token inv��lido
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso con token inválido")
        // Obtener roles con sus permisos
        const permisos = await prisma.permiso.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            nombrePermiso: "asc",
          },
        })

        console.log("API: Permisos obtenidos en modo desarrollo con token inválido", { cantidad: permisos.length })
        return NextResponse.json({ permisos }, { status: 200 })
      }
    }

    if (!userData) {
      console.log("API roles: No se pudo obtener datos del usuario desde el token")

      // En desarrollo, permitir acceso sin datos de usuario
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso sin datos de usuario")
        // Obtener roles con sus permisos
        const permisos = await prisma.permiso.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            nombrePermiso: "asc",
          },
        })

        console.log("API: Permisos obtenidos en modo desarrollo sin permisos adecuados", { cantidad: permisos.length })
        return NextResponse.json({ permisos }, { status: 200 })
      }

      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario tenga rol de administrador
    if (userData.rol !== "ADMINISTRADOR" && userData.rol !== "ADMINISTRADOR_SISTEMA") {
      console.log("API: Usuario sin permisos para gestionar roles. Rol actual:", userData.rol)

      // En desarrollo, permitir acceso sin importar el rol
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso sin importar el rol")
        // Obtener roles con sus permisos
        const permisos = await prisma.permiso.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            nombrePermiso: "asc",
          },
        })

        console.log("API: Permisos obtenidos en modo desarrollo sin permisos adecuados", { cantidad: permisos.length })
        return NextResponse.json({ permisos }, { status: 200 })
      }

      return NextResponse.json({ message: "No tienes permisos para gestionar roles" }, { status: 403 })
    }

    // Obtener permisos
    const permisos = await prisma.permiso.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        nombrePermiso: "asc",
      },
    })

    console.log("API: Permisos obtenidos correctamente", { cantidad: permisos.length })
    return NextResponse.json({ permisos }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener permisos:", error)

    // En desarrollo, permitir acceso incluso si hay un error
    if (process.env.NODE_ENV === "development") {
      console.log("API roles: Modo desarrollo - Permitiendo acceso a pesar del error")
      try {
        // Obtener roles con sus permisos
        const permisos = await prisma.permiso.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            nombrePermiso: "asc",
          },
        })

        console.log("API: Permisos obtenidos en modo desarrollo a pesar del error", { cantidad: permisos.length })
        return NextResponse.json({ permisos }, { status: 200 })
      } catch (innerError) {
        console.error("Error en el modo de recuperación:", innerError)
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


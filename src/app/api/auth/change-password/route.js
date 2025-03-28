import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import bcrypt from "bcrypt"
import { verifyJWT } from "@/src/lib/jwt"
import { cookies } from "next/headers"

export async function POST(request) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Obtener el token de la cookie o del encabezado de autorización
    const authHeader = request.headers.get("authorization")
    let token = null

    // Intentar obtener el token del encabezado de autorización
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
      console.log("Token obtenido del encabezado:", token ? "Sí" : "No")
    }

    // Si no hay token en el encabezado, intentar obtenerlo de las cookies
    if (!token) {
      // En Next.js 15, cookies() debe ser esperado (awaited)
      const cookieStore = await cookies()
      const accessToken = cookieStore.get("at")?.value
      if (accessToken) {
        token = accessToken
        console.log("Token obtenido de las cookies:", token ? "Sí" : "No")
      }
    }

    // Si aún no hay token, verificar si hay un ID de usuario en el cuerpo de la solicitud
    // (esto es solo para pruebas y desarrollo, no recomendado para producción)
    if (!token && process.env.NODE_ENV !== "production" && body.userId) {
      console.log("Usando ID de usuario del cuerpo para pruebas:", body.userId)
      const userId = body.userId

      // Buscar el usuario en la base de datos
      const user = await prisma.usuario.findUnique({
        where: { idUsuario: userId },
      })

      if (!user) {
        console.error("Usuario no encontrado:", userId)
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
      }

      // Verificar la contraseña actual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.contrasena)

      if (!isPasswordValid) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
      }

      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Actualizar la contraseña y el estado del usuario
      await prisma.usuario.update({
        where: {
          idUsuario: userId,
        },
        data: {
          contrasena: hashedPassword,
          estado: "ACTIVO",
          ultimoCambioContrasena: new Date(),
        },
      })

      return NextResponse.json({ message: "Contraseña actualizada correctamente" }, { status: 200 })
    }

    // Verificar que haya un token
    if (!token) {
      console.error("No se encontró token de acceso")
      return NextResponse.json({ error: "No autorizado - Token no proporcionado" }, { status: 401 })
    }

    // Verificar el token y obtener el ID de usuario
    let decoded
    try {
      decoded = verifyJWT(token)
      console.log("Token decodificado:", decoded)
    } catch (error) {
      console.error("Error al verificar el token:", error)
      return NextResponse.json({ error: "No autorizado - Token inválido" }, { status: 401 })
    }

    const userId = decoded.idUsuario
    console.log("ID de usuario:", userId)

    // Buscar el usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: {
        idUsuario: userId,
      },
    })

    if (!user) {
      console.error("Usuario no encontrado:", userId)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar la contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.contrasena)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar la contraseña y el estado del usuario
    await prisma.usuario.update({
      where: {
        idUsuario: userId,
      },
      data: {
        contrasena: hashedPassword,
        estado: "ACTIVO",
        ultimoCambioContrasena: new Date(),
      },
    })

    return NextResponse.json({ message: "Contraseña actualizada correctamente" }, { status: 200 })
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error)
    return NextResponse.json({ error: "Error al cambiar la contraseña: " + error.message }, { status: 500 })
  }
}


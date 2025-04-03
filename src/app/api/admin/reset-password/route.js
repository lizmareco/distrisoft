import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { idUsuario, newPassword } = body

    console.log(`API reset-password: Intentando restablecer contraseña para usuario ID: ${idUsuario}`)

    if (!idUsuario || !newPassword) {
      return NextResponse.json(
        { message: "ID de usuario y nueva contraseña son requeridos" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Validar la contraseña
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 8 caracteres" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que el usuario exista
    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: idUsuario,
        deletedAt: null,
      },
    })

    if (!usuario) {
      console.log(`API reset-password: Usuario con ID ${idUsuario} no encontrado`)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar la contraseña del usuario
    await prisma.usuario.update({
      where: {
        idUsuario: idUsuario,
      },
      data: {
        contrasena: hashedPassword,
        updatedAt: new Date(),
      },
    })

    console.log(`API reset-password: Contraseña actualizada para usuario ID: ${idUsuario}`)

    // Si el usuario estaba bloqueado o con contraseña vencida, activarlo
    if (usuario.estado === "BLOQUEADO" || usuario.estado === "VENCIDO") {
      await prisma.usuario.update({
        where: {
          idUsuario: idUsuario,
        },
        data: {
          estado: "ACTIVO",
          updatedAt: new Date(),
        },
      })
      console.log(`API reset-password: Usuario ID ${idUsuario} activado desde estado ${usuario.estado}`)
    }

    // Limpiar los intentos fallidos de inicio de sesión si es posible
    try {
      const AuthController = require("@/src/backend/controllers/auth-controller").default
      const authController = new AuthController()
      await authController.limpiarIntentosFallidos(idUsuario)
      console.log(`API reset-password: Intentos fallidos limpiados para usuario ID: ${idUsuario}`)
    } catch (err) {
      console.warn("No se pudieron limpiar los intentos fallidos:", err.message)
    }

    return NextResponse.json({ message: "Contraseña restablecida exitosamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al restablecer contraseña:", error)
    return NextResponse.json(
      {
        message: "Error al restablecer contraseña",
        error: error.message,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


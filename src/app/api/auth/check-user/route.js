import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nombreUsuario = searchParams.get("nombreUsuario")

    if (!nombreUsuario) {
      return NextResponse.json({ message: "Nombre de usuario requerido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Buscar el usuario por nombre de usuario
    const usuario = await prisma.usuario.findFirst({
      where: {
        nombreUsuario: nombreUsuario,
        deletedAt: null,
      },
      select: {
        idUsuario: true,
        estado: true,
        ultimoCambioContrasena: true,
      },
    })

    if (!usuario) {
      // Por seguridad, no revelamos si el usuario existe o no
      return NextResponse.json({ usuario: null }, { status: HTTP_STATUS_CODES.ok })
    }

    // Calcular días desde el último cambio de contraseña
    const ultimoCambio = new Date(usuario.ultimoCambioContrasena)
    const fechaActual = new Date()
    const diasTranscurridos = Math.floor((fechaActual - ultimoCambio) / (1000 * 60 * 60 * 24))

    return NextResponse.json(
      {
        usuario: {
          ...usuario,
          diasDesdeUltimoCambio: diasTranscurridos,
        },
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("Error al verificar usuario:", error)
    return NextResponse.json(
      { message: "Error al verificar usuario" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

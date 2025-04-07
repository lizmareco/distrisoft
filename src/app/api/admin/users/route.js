import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    // En desarrollo, omitimos la verificación de autenticación
    const isDevelopment = process.env.NODE_ENV === "development"

    if (!isDevelopment) {
      // Aquí iría la verificación de autenticación en producción
      // Similar a la que tenemos en la ruta de auditoría
    }

    // Obtener la lista de usuarios activos
    const usuarios = await prisma.usuario.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        idUsuario: true,
        nombreUsuario: true,
        persona: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        nombreUsuario: "asc",
      },
    })

    // Formatear la respuesta para que sea más fácil de usar en el frontend
    const usuariosFormateados = usuarios.map((usuario) => ({
      id: usuario.idUsuario,
      nombre: `${usuario.persona?.nombre || ""} ${usuario.persona?.apellido || ""} (${usuario.nombreUsuario})`,
    }))

    return NextResponse.json({ usuarios: usuariosFormateados }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener lista de usuarios:", error)
    return NextResponse.json(
      { message: "Error al obtener lista de usuarios", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


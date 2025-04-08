import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const { idUsuario, estado } = await request.json()

    if (!idUsuario || !estado) {
      return NextResponse.json(
        { message: "ID de usuario y estado son requeridos" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que el estado sea válido
    const estadosValidos = ["ACTIVO", "BLOQUEADO", "VENCIDO", "INACTIVO"]
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json({ message: "Estado no válido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Actualizar el estado del usuario
    await prisma.usuario.update({
      where: {
        idUsuario: idUsuario,
      },
      data: {
        estado: estado,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(
      { message: "Estado de usuario actualizado correctamente" },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("Error al actualizar estado de usuario:", error)
    return NextResponse.json(
      { message: "Error al actualizar estado de usuario" },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

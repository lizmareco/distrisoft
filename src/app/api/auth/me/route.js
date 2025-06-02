import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyJWT } from "@/src/lib/jwt" // este debe existir y funcionar
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("at")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const decoded = verifyJWT(token)

    if (!decoded || !decoded.idUsuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: decoded.idUsuario },
      include: { persona: true },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error("Error en /api/auth/me:", error)
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}

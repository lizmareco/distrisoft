import { NextResponse } from "next/server"
import AuthController from "@/src/backend/controllers/auth-controller"
import { prisma } from "@/prisma/client"
import { cookies } from "next/headers"

export async function GET(request) {
  try {
    const authController = new AuthController()
    const token = await authController.hasAccessToken(request)
    const userData = await authController.getUserFromToken(token)

    if (!userData?.idUsuario) {
      return NextResponse.json({ message: "Usuario no autenticado" }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: userData.idUsuario },
      select: { ultimoCambioContrasena: true }
    })

    if (!usuario?.ultimoCambioContrasena) {
      return NextResponse.json({ passwordExpiry: null }, { status: 200 })
    }

    const hoy = new Date()
    const cambio = new Date(usuario.ultimoCambioContrasena)
    const diasTranscurridos = Math.floor((hoy - cambio) / (1000 * 60 * 60 * 24))

    const diasRestantes = 90 - diasTranscurridos

    return NextResponse.json({
      diasRestantes,
      porVencer: diasRestantes <= 10 && diasRestantes > 0
    }, { status: 200 })
  } catch (error) {
    console.error("Error en verificación de vencimiento:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

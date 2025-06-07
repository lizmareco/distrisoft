import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/prisma/client"
import jwt from "jsonwebtoken"

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("at")?.value

    if (!accessToken) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
    const idUsuario = decoded?.idUsuario

    if (!idUsuario) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 })
    }

    const hoy = new Date()
    const fechaLimite = new Date()
    fechaLimite.setDate(hoy.getDate() - 80)

    // 🔐 Vencimiento de contraseña
    const usuariosPorVencer = await prisma.usuario.findMany({
      where: {
        idUsuario,
        estado: "ACTIVO",
        ultimoCambioContrasena: {
          lt: fechaLimite,
        },
        deletedAt: null,
      },
      select: {
        idUsuario: true,
      },
    })

    const notificacionesVencimiento = usuariosPorVencer.map((usuario) => ({
      tipo: "vencimiento_contrasena",
      mensaje: `Tu contraseña está por vencer. Por favor, cámbiala lo antes posible.`,
      fechaEnvio: new Date().toISOString(),
      leido: false,
      redireccion: "/profile/change-password",
    }))

    // 🧪 Materias primas con bajo stock
    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: {
        stockActual: {
          lt: 10,
        },
        deletedAt: null,
      },
      select: {
        idMateriaPrima: true,
        nombreMateriaPrima: true,
        stockActual: true,
      },
    })

    const notificacionesStock = materiasPrimas.map((mp) => ({
      tipo: "stock_bajo",
      mensaje: `La materia prima "${mp.nombreMateriaPrima}" tiene bajo stock (${mp.stockActual}).`,
      fechaEnvio: new Date().toISOString(),
      leido: false,
      redireccion: "/inventario/materiaprima",
    }))

    const notificaciones = [...notificacionesVencimiento, ...notificacionesStock]

    return NextResponse.json({ notifications: notificaciones }, { status: 200 })
  } catch (error) {
    console.error("Error al obtener notificaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

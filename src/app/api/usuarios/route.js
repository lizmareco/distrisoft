import { NextResponse } from "next/server"
import { usuarioController } from "../../../backend/controllers/usuarioController"

// GET /api/usuarios - Obtener todos los usuarios
export async function GET() {
  try {
    console.log("API: Recibida solicitud para obtener usuarios")
    const resultado = await usuarioController.obtenerUsuarios()
    console.log("API: Usuarios obtenidos correctamente", resultado)
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener usuarios:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/usuarios - Crear un nuevo usuario
export async function POST(request) {
  try {
    const datos = await request.json()
    console.log("API: Recibida solicitud para crear usuario", datos)
    const resultado = await usuarioController.crearUsuario(datos)
    console.log("API: Usuario creado correctamente", resultado)
    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error("API: Error al crear usuario:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}


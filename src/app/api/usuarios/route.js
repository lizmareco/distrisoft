import { NextResponse } from "next/server"
import { usuarioController } from "../../../backend/controllers/usuarioController"

// GET /api/usuarios - Obtener todos los usuarios
export async function GET() {
  try {
    const resultado = await usuarioController.obtenerUsuarios()
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/usuarios - Crear un nuevo usuario
export async function POST(request) {
  try {
    const datos = await request.json()
    const resultado = await usuarioController.crearUsuario(datos)
    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}


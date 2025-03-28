import { NextResponse } from "next/server"
import { usuarioController } from "../../../../backend/controllers/usuarioController"

// GET /api/usuarios/[id] - Obtener un usuario por ID
export async function GET(request, { params }) {
  try {
    const { id } = params
    const resultado = await usuarioController.obtenerUsuarioPorId(id)
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

// PUT /api/usuarios/[id] - Actualizar un usuario
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const datos = await request.json()
    const resultado = await usuarioController.actualizarUsuario(id, datos)
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/usuarios/[id] - Eliminar un usuario
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const resultado = await usuarioController.eliminarUsuario(id)
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}


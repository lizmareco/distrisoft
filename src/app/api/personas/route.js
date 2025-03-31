import { NextResponse } from "next/server"
import { personaController } from "../../../backend/controllers/personaController"

// GET /api/personas - Obtener todas las personas
export async function GET() {
  try {
    const resultado = await personaController.obtenerPersonas()
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


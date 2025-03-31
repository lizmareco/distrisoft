import { NextResponse } from "next/server"
import { personaController } from "../../../../backend/controllers/personacontroller"

// GET /api/personas/buscar?termino=xxx - Buscar personas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const termino = searchParams.get("termino") || ""

    const resultado = await personaController.buscarPersonas(termino)
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


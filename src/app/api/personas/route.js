import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
      where: {
        deletedAt: null,
      },
    })

    return NextResponse.json(personas)
  } catch (error) {
    console.error("Error al obtener personas:", error)
    return NextResponse.json({ error: "Error al obtener personas" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()

    const persona = await prisma.persona.create({
      data: {
        nroDocumento: data.nroDocumento,
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: new Date(data.fechaNacimiento),
        direccion: data.direccion,
        nroTelefono: data.nroTelefono,
        correoPersona: data.correoPersona,
        idCiudad: Number.parseInt(data.idCiudad),
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    return NextResponse.json(persona)
  } catch (error) {
    console.error("Error al crear persona:", error)
    return NextResponse.json({ error: "Error al crear persona" }, { status: 500 })
  }
}




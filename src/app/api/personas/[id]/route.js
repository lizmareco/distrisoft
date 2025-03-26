import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const { id } = params

    const persona = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    if (!persona) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 })
    }

    return NextResponse.json(persona)
  } catch (error) {
    console.error("Error al obtener persona:", error)
    return NextResponse.json({ error: "Error al obtener persona" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    const persona = await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
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
        updatedAt: new Date(),
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    return NextResponse.json(persona)
  } catch (error) {
    console.error("Error al actualizar persona:", error)
    return NextResponse.json({ error: "Error al actualizar persona" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Persona eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar persona:", error)
    return NextResponse.json({ error: "Error al eliminar persona" }, { status: 500 })
  }
}




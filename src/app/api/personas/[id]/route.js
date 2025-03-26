import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: "ID de persona requerido" }, { status: 400 })
    }

    const persona = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
        tipoPersona: true,
      },
    })

    if (!persona) {
      return NextResponse.json({ message: "Persona no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ persona })
  } catch (error) {
    console.error(`Error al obtener persona con ID ${params.id}:`, error)
    return NextResponse.json({ message: "Error al obtener persona", error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: "ID de persona requerido" }, { status: 400 })
    }

    const body = await request.json()

    // Verificar si la persona existe
    const personaExistente = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!personaExistente) {
      return NextResponse.json({ message: "Persona no encontrada" }, { status: 404 })
    }

    // Actualizar la persona
    const persona = await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        nroDocumento: body.nroDocumento,
        fechaNacimiento: new Date(body.fechaNacimiento),
        direccion: body.direccion,
        nroTelefono: body.nroTelefono,
        correoPersona: body.correoPersona,
        idCiudad: Number.parseInt(body.idCiudad),
        idTipoPersona: Number.parseInt(body.idTipoPersona),
        idTipoDocumento: Number.parseInt(body.idTipoDocumento),
        updatedAt: new Date(),
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
        tipoPersona: true,
      },
    })

    return NextResponse.json({ message: "Persona actualizada exitosamente", persona })
  } catch (error) {
    console.error(`Error al actualizar persona con ID ${params.id}:`, error)
    return NextResponse.json({ message: "Error al actualizar persona", error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: "ID de persona requerido" }, { status: 400 })
    }

    // Verificar si la persona existe
    const personaExistente = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!personaExistente) {
      return NextResponse.json({ message: "Persona no encontrada" }, { status: 404 })
    }

    // Soft delete de la persona
    await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Persona eliminada exitosamente" })
  } catch (error) {
    console.error(`Error al eliminar persona con ID ${params.id}:`, error)
    return NextResponse.json({ message: "Error al eliminar persona", error: error.message }, { status: 500 })
  }
}


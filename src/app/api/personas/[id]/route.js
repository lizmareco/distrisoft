import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo persona con ID: ${id}`)

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
      console.log(`API: Persona con ID ${id} no encontrada`)
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 })
    }

    console.log(`API: Persona con ID ${id} encontrada`)
    return NextResponse.json(persona)
  } catch (error) {
    console.error("API: Error al obtener persona:", error)
    return NextResponse.json({ error: "Error al obtener persona" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params
    const data = await request.json()
    console.log(`API: Actualizando persona con ID: ${id}`)

    // Obtener la persona actual para auditoría
    const personaAnterior = await prisma.persona.findUnique({
      where: { idPersona: Number.parseInt(id) },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    if (!personaAnterior) {
      console.log(`API: Persona con ID ${id} no encontrada para actualizar`)
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 })
    }

    // Actualizar la persona
    const persona = await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
      data: {
        nroDocumento: data.nroDocumento,
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        direccion: data.direccion,
        nroTelefono: data.nroTelefono,
        correoPersona: data.correoPersona,
        idCiudad: data.idCiudad ? Number.parseInt(data.idCiudad) : null,
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
        updatedAt: new Date(),
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion("Persona", id, personaAnterior, persona, userData.idUsuario, request)

    console.log(`API: Persona con ID ${id} actualizada correctamente`)
    return NextResponse.json(persona)
  } catch (error) {
    console.error("API: Error al actualizar persona:", error)
    return NextResponse.json({ error: "Error al actualizar persona" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params
    console.log(`API: Eliminando persona con ID: ${id}`)

    // Obtener la persona actual para auditoría
    const personaAnterior = await prisma.persona.findUnique({
      where: { idPersona: Number.parseInt(id) },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    if (!personaAnterior) {
      console.log(`API: Persona con ID ${id} no encontrada para eliminar`)
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 })
    }

    // Eliminar la persona (soft delete)
    await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Persona", id, personaAnterior, userData.idUsuario, request)

    console.log(`API: Persona con ID ${id} eliminada correctamente`)
    return NextResponse.json({ message: "Persona eliminada correctamente" })
  } catch (error) {
    console.error("API: Error al eliminar persona:", error)
    return NextResponse.json({ error: "Error al eliminar persona" }, { status: 500 })
  }
}


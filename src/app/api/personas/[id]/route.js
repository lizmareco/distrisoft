import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
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
        tipoDocumento: true,
        ciudad: true,
      },
    })

    if (!persona) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    return NextResponse.json(persona, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener persona:", error)
    return NextResponse.json(
      { error: "Error al obtener persona", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()
    console.log(`API: Actualizando persona con ID: ${id}`)
    console.log("Datos recibidos:", data)

    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    // Obtener la persona actual para auditoría
    const personaAnterior = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(id),
      },
      include: {
        tipoDocumento: true,
      },
    })

    if (!personaAnterior) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si ya existe otra persona con el mismo número de documento
    if (
      data.nroDocumento &&
      (data.nroDocumento !== personaAnterior.nroDocumento ||
        Number.parseInt(data.idTipoDocumento) !== personaAnterior.idTipoDocumento)
    ) {
      const personaExistente = await prisma.persona.findFirst({
        where: {
          idTipoDocumento: Number.parseInt(data.idTipoDocumento),
          nroDocumento: data.nroDocumento,
          idPersona: { not: Number.parseInt(id) }, // Excluir la persona actual
          deletedAt: null, // Solo considerar personas activas
        },
        include: {
          tipoDocumento: true,
        },
      })

      if (personaExistente) {
        console.log(`Ya existe otra persona con el documento ${data.nroDocumento}: ID ${personaExistente.idPersona}`)
        return NextResponse.json(
          {
            error: `Ya existe otra persona registrada con el documento ${data.nroDocumento}`,
            personaExistente: {
              id: personaExistente.idPersona,
              nombre: `${personaExistente.nombre} ${personaExistente.apellido}`,
              tipoDocumento: personaExistente.tipoDocumento?.descTipoDocumento || "Documento",
            },
          },
          { status: HTTP_STATUS_CODES.conflict }, // 409 Conflict
        )
      }
    }

    // Actualizar la persona
    const persona = await prisma.persona.update({
      where: {
        idPersona: Number.parseInt(id),
      },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        nroDocumento: data.nroDocumento,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        direccion: data.direccion,
        nroTelefono: data.nroTelefono,
        correoPersona: data.correoPersona,
        idCiudad: data.idCiudad ? Number.parseInt(data.idCiudad) : null,
        idTipoDocumento: data.idTipoDocumento ? Number.parseInt(data.idTipoDocumento) : null,
        updatedAt: new Date(),
      },
      include: {
        tipoDocumento: true,
        ciudad: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Persona",
      idRegistro: id.toString(),
      accion: "ACTUALIZAR",
      valorAnterior: personaAnterior,
      valorNuevo: persona,
      idUsuario: userData.idUsuario,
      request: request,
    })

    return NextResponse.json(persona, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al actualizar persona:", error)
    return NextResponse.json(
      { error: "Error al actualizar persona", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando persona con ID: ${id}`)

    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    // Obtener la persona actual para auditoría
    const personaAnterior = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(id),
      },
    })

    if (!personaAnterior) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
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
    await auditoriaService.registrarAuditoria({
      entidad: "Persona",
      idRegistro: id.toString(),
      accion: "ELIMINAR",
      valorAnterior: personaAnterior,
      valorNuevo: null,
      idUsuario: userData.idUsuario,
      request: request,
    })

    return NextResponse.json({ message: "Persona eliminada correctamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al eliminar persona:", error)
    return NextResponse.json(
      { error: "Error al eliminar persona", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

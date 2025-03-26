import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: "ID de empresa requerido" }, { status: 400 })
    }

    const empresa = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
        tipoPersona: true,
        persona: true,
      },
    })

    if (!empresa) {
      return NextResponse.json({ message: "Empresa no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ empresa })
  } catch (error) {
    console.error(`Error al obtener empresa con ID ${params.id}:`, error)
    return NextResponse.json({ message: "Error al obtener empresa", error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: "ID de empresa requerido" }, { status: 400 })
    }

    const body = await request.json()

    // Verificar si la empresa existe
    const empresaExistente = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!empresaExistente) {
      return NextResponse.json({ message: "Empresa no encontrada" }, { status: 404 })
    }

    // Actualizar la empresa
    const empresa = await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        razonSocial: body.razonSocial,
        idTipoPersona: Number.parseInt(body.idTipoPersona),
        idTipoDocumento: Number.parseInt(body.idTipoDocumento),
        ruc: body.ruc,
        direccionEmpresa: body.direccionEmpresa,
        idCiudad: Number.parseInt(body.idCiudad),
        correoEmpresa: body.correoEmpresa,
        telefono: body.telefono,
        personaContacto: Number.parseInt(body.personaContacto),
        idCategoriaEmpresa: Number.parseInt(body.idCategoriaEmpresa),
        updatedAt: new Date(),
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
        tipoPersona: true,
        persona: true,
      },
    })

    return NextResponse.json({ message: "Empresa actualizada exitosamente", empresa })
  } catch (error) {
    console.error(`Error al actualizar empresa con ID ${params.id}:`, error)
    return NextResponse.json({ message: "Error al actualizar empresa", error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: "ID de empresa requerido" }, { status: 400 })
    }

    // Verificar si la empresa existe
    const empresaExistente = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!empresaExistente) {
      return NextResponse.json({ message: "Empresa no encontrada" }, { status: 404 })
    }

    // Soft delete de la empresa
    await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Empresa eliminada exitosamente" })
  } catch (error) {
    console.error(`Error al eliminar empresa con ID ${params.id}:`, error)
    return NextResponse.json({ message: "Error al eliminar empresa", error: error.message }, { status: 500 })
  }
}


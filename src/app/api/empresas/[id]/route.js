import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET(request, { params }) {
  try {
    console.log(`Obteniendo empresa con ID: ${params.id}...`)

    const { id } = params

    const empresa = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    console.log(`Empresa encontrada con ID: ${id}`)
    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al obtener empresa:", error)
    return NextResponse.json({ error: "Error al obtener empresa: " + error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    console.log(`Actualizando empresa con ID: ${params.id}...`)
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params
    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Obtener la empresa actual para auditoría
    const empresaAnterior = await prisma.empresa.findUnique({
      where: { idEmpresa: Number.parseInt(id) },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    if (!empresaAnterior) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    // Actualizar la empresa
    const empresa = await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        idCategoriaEmpresa: data.idCategoriaEmpresa ? Number.parseInt(data.idCategoriaEmpresa) : undefined,
        razonSocial: data.razonSocial,
        idTipoDocumento: data.idTipoDocumento ? Number.parseInt(data.idTipoDocumento) : undefined,
        ruc: data.ruc,
        direccionEmpresa: data.direccionEmpresa,
        idCiudad: data.idCiudad ? Number.parseInt(data.idCiudad) : undefined,
        correoEmpresa: data.correoEmpresa,
        telefono: data.telefono,
        personaContacto: data.personaContacto ? Number.parseInt(data.personaContacto) : null,
        updatedAt: new Date(),
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion("Empresa", id, empresaAnterior, empresa, userData.idUsuario, request)

    console.log(`Empresa actualizada con ID: ${id}`)
    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al actualizar empresa:", error)
    return NextResponse.json({ error: "Error al actualizar empresa: " + error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log(`Eliminando empresa con ID: ${params.id}...`)
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params

    // Obtener la empresa actual para auditoría
    const empresaAnterior = await prisma.empresa.findUnique({
      where: { idEmpresa: Number.parseInt(id) },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    if (!empresaAnterior) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    // Eliminar la empresa (soft delete)
    await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Empresa", id, empresaAnterior, userData.idUsuario, request)

    console.log(`Empresa eliminada con ID: ${id}`)
    return NextResponse.json({ message: "Empresa eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar empresa:", error)
    return NextResponse.json({ error: "Error al eliminar empresa: " + error.message }, { status: 500 })
  }
}


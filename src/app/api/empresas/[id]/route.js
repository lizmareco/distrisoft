import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
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

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al obtener empresa:", error)
    return NextResponse.json({ error: "Error al obtener empresa" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    const empresa = await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        idCategoriaEmpresa: Number.parseInt(data.idCategoriaEmpresa),
        razonSocial: data.razonSocial,
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
        ruc: data.ruc,
        direccionEmpresa: data.direccionEmpresa,
        idCiudad: Number.parseInt(data.idCiudad),
        correoEmpresa: data.correoEmpresa,
        telefono: data.telefono,
        personaContacto: Number.parseInt(data.personaContacto),
        updatedAt: new Date(),
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al actualizar empresa:", error)
    return NextResponse.json({ error: "Error al actualizar empresa" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Empresa eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar empresa:", error)
    return NextResponse.json({ error: "Error al eliminar empresa" }, { status: 500 })
  }
}



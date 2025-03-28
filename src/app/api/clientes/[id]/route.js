import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const { id } = params

    const cliente = await prisma.cliente.findUnique({
      where: {
        idCliente: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al obtener cliente:", error)
    return NextResponse.json({ error: "Error al obtener cliente" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    const cliente = await prisma.cliente.update({
      where: {
        idCliente: Number.parseInt(id),
      },
      data: {
        idPersona: Number.parseInt(data.idPersona),
        idSectorCliente: Number.parseInt(data.idSectorCliente),
        idCondicionPago: Number.parseInt(data.idCondicionPago),
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : null,
        updatedAt: new Date(),
      },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.cliente.update({
      where: {
        idCliente: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 })
  }
}


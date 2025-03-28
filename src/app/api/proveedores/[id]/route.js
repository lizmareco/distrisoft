import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET(request, { params }) {
  try {
    const { id } = params

    const proveedor = await prisma.proveedor.findUnique({
      where: {
        idProveedor: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error al obtener proveedor:", error)
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    const proveedor = await prisma.proveedor.update({
      where: {
        idProveedor: Number.parseInt(id),
      },
      data: {
        idEmpresa: Number.parseInt(data.idEmpresa),
        idCondicionPago: Number.parseInt(data.idCondicionPago),
        updatedAt: new Date(),
      },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error al actualizar proveedor:", error)
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    await prisma.proveedor.update({
      where: {
        idProveedor: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Proveedor eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar proveedor:", error)
    return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 })
  }
}


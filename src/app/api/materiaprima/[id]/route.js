import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET - Obtener una materia prima por ID
export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: {
        idMateriaPrima: id,
        deletedAt: null,
      },
      include: {
        unidadMedida: {
          select: {
            idUnidadMedida: true,
            descUnidadMedida: true,
            abreviatura: true,
          },
        },
        estadoMateriaPrima: {
          select: {
            idEstadoMateriaPrima: true,
            descEstadoMateriaPrima: true,
          },
        },
      },
    })

    if (!materiaPrima) {
      return NextResponse.json({ error: "Materia prima no encontrada" }, { status: 404 })
    }

    return NextResponse.json(materiaPrima)
  } catch (error) {
    console.error("Error al obtener materia prima:", error)
    return NextResponse.json({ error: "Error al obtener materia prima" }, { status: 500 })
  }
}

// PUT - Actualizar una materia prima
export async function PUT(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    const data = await request.json()

    // Verificar si ya existe otra materia prima con el mismo nombre
    const materiaPrimaExistente = await prisma.materiaPrima.findFirst({
      where: {
        nombreMateriaPrima: {
          equals: data.nombreMateriaPrima,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        idMateriaPrima: {
          not: id,
        },
        deletedAt: null,
      },
    })

    if (materiaPrimaExistente) {
      return NextResponse.json({ error: "Ya existe otra materia prima con este nombre" }, { status: 400 })
    }

    const materiaPrimaActualizada = await prisma.materiaPrima.update({
      where: {
        idMateriaPrima: id,
      },
      data: {
        nombreMateriaPrima: data.nombreMateriaPrima,
        descMateriaPrima: data.descMateriaPrima,
        stockActual: Number.parseFloat(data.stockActual),
        stockMinimo: Number.parseFloat(data.stockMinimo),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        idEstadoMateriaPrima: Number.parseInt(data.idEstadoMateriaPrima),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(materiaPrimaActualizada)
  } catch (error) {
    console.error("Error al actualizar materia prima:", error)
    return NextResponse.json({ error: "Error al actualizar materia prima" }, { status: 500 })
  }
}

// DELETE - Eliminar una materia prima (soft delete)
export async function DELETE(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    await prisma.materiaPrima.update({
      where: {
        idMateriaPrima: id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Materia prima eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar materia prima:", error)
    return NextResponse.json({ error: "Error al eliminar materia prima" }, { status: 500 })
  }
}


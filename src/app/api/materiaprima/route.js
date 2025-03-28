import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET - Obtener todas las materias primas
export async function GET() {
  try {
    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: {
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

    return NextResponse.json(materiasPrimas)
  } catch (error) {
    console.error("Error al obtener materias primas:", error)
    return NextResponse.json({ error: "Error al obtener materias primas" }, { status: 500 })
  }
}

// POST - Crear una nueva materia prima
export async function POST(request) {
  try {
    const data = await request.json()

    // Verificar si ya existe una materia prima con el mismo nombre
    const materiaPrimaExistente = await prisma.materiaPrima.findFirst({
      where: {
        nombreMateriaPrima: {
          equals: data.nombreMateriaPrima,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        deletedAt: null,
      },
    })

    if (materiaPrimaExistente) {
      return NextResponse.json({ error: "Ya existe una materia prima con este nombre" }, { status: 400 })
    }

    const nuevaMateriaPrima = await prisma.materiaPrima.create({
      data: {
        nombreMateriaPrima: data.nombreMateriaPrima,
        descMateriaPrima: data.descMateriaPrima,
        stockActual: Number.parseFloat(data.stockActual),
        stockMinimo: Number.parseFloat(data.stockMinimo),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        idEstadoMateriaPrima: Number.parseInt(data.idEstadoMateriaPrima),
        createdAt: new Date(),
      },
    })

    return NextResponse.json(nuevaMateriaPrima, { status: 201 })
  } catch (error) {
    console.error("Error al crear materia prima:", error)
    return NextResponse.json({ error: "Error al crear materia prima" }, { status: 500 })
  }
}


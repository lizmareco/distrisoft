import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener todas las materias primas
export async function GET() {
  try {
    console.log("API: Obteniendo materias primas...")

    const materiasPrimas = await prisma.materiaPrima.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        estadoMateriaPrima: {
          select: {
            idEstadoMateriaPrima: true,
            descEstadoMateriaPrima: true,
          },
        },
      },
    })

    console.log(`API: Se encontraron ${materiasPrimas.length} materias primas`)
    return NextResponse.json(materiasPrimas)
  } catch (error) {
    console.error("API: Error al obtener materias primas:", error)
    return NextResponse.json({ error: "Error al obtener materias primas" }, { status: 500 })
  }
}

// POST - Crear una nueva materia prima
export async function POST(request) {
  try {
    console.log("API: Creando nueva materia prima...")
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

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
      console.log(`API: Ya existe una materia prima con el nombre "${data.nombreMateriaPrima}"`)
      return NextResponse.json({ error: "Ya existe una materia prima con este nombre" }, { status: 400 })
    }

    const nuevaMateriaPrima = await prisma.materiaPrima.create({
      data: {
        nombreMateriaPrima: data.nombreMateriaPrima,
        descMateriaPrima: data.descMateriaPrima,
        idEstadoMateriaPrima: Number.parseInt(data.idEstadoMateriaPrima),
        createdAt: new Date(),
      },
      include: {
        estadoMateriaPrima: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion(
      "MateriaPrima",
      nuevaMateriaPrima.idMateriaPrima,
      nuevaMateriaPrima,
      userData.idUsuario,
      request,
    )

    console.log(`API: Materia prima creada con ID: ${nuevaMateriaPrima.idMateriaPrima}`)
    return NextResponse.json(nuevaMateriaPrima, { status: 201 })
  } catch (error) {
    console.error("API: Error al crear materia prima:", error)
    return NextResponse.json({ error: "Error al crear materia prima" }, { status: 500 })
  }
}


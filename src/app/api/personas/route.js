import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    console.log("API personas: Solicitud GET recibida")

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    // Construir la consulta
    const where = {
      deletedAt: null,
    }

    // Agregar filtro de búsqueda si existe
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { nroDocumento: { contains: search, mode: "insensitive" } },
        { correoPersona: { contains: search, mode: "insensitive" } },
      ]
    }

    // Obtener todas las personas
    const personas = await prisma.persona.findMany({
      where,
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`API personas: Se encontraron ${personas.length} personas`)
    return NextResponse.json({ personas })
  } catch (error) {
    console.error("Error al obtener personas:", error)
    return NextResponse.json({ message: "Error al obtener personas", error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("API personas: Solicitud POST recibida")

    const body = await request.json()
    console.log("Datos recibidos:", body)

    // Validar datos
    if (!body.nombre || !body.apellido) {
      return NextResponse.json({ message: "Nombre y apellido son requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una persona con el mismo documento
    if (body.nroDocumento && body.idTipoDocumento) {
      const personaExistente = await prisma.persona.findFirst({
        where: {
          nroDocumento: body.nroDocumento,
          idTipoDocumento: Number.parseInt(body.idTipoDocumento),
          deletedAt: null,
        },
      })

      if (personaExistente) {
        return NextResponse.json({ message: "Ya existe una persona con este número de documento" }, { status: 400 })
      }
    }

    // Crear la persona
    const persona = await prisma.persona.create({
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        nroDocumento: body.nroDocumento,
        fechaNacimiento: new Date(body.fechaNacimiento),
        direccion: body.direccion,
        nroTelefono: body.nroTelefono,
        correoPersona: body.correoPersona,
        idCiudad: Number.parseInt(body.idCiudad),
        idTipoDocumento: Number.parseInt(body.idTipoDocumento),
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    console.log("Persona creada:", persona)
    return NextResponse.json({ message: "Persona creada exitosamente", persona }, { status: 201 })
  } catch (error) {
    console.error("Error al crear persona:", error)
    return NextResponse.json({ message: "Error al crear persona", error: error.message }, { status: 500 })
  }
}


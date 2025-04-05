import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

// GET /api/personas - Obtener todas las personas
export async function GET() {
  try {
    console.log("API: Consultando personas en la base de datos")
    const personas = await prisma.persona.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        apellido: "asc",
      },
    })
    console.log("API: Personas encontradas:", personas.length)

    // Devolver directamente el array de personas, no un objeto con propiedad personas
    return NextResponse.json(personas, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener personas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/personas - Crear una nueva persona
export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const data = await request.json()
    console.log("API: Creando nueva persona con datos:", data)

    // Validar datos requeridos
    if (!data.nombre || !data.apellido || !data.idTipoDocumento || !data.nroDocumento) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos (nombre, apellido, tipo de documento o número de documento)",
        },
        { status: 400 },
      )
    }

    // Crear la persona
    const persona = await prisma.persona.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        nroDocumento: data.nroDocumento,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        direccion: data.direccion,
        nroTelefono: data.nroTelefono,
        correoPersona: data.correoPersona,
        idCiudad: data.idCiudad ? Number.parseInt(data.idCiudad) : null,
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
      },
      include: {
        ciudad: true,
        tipoDocumento: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Persona", persona.idPersona, persona, userData.idUsuario, request)

    console.log("API: Persona creada con ID:", persona.idPersona)
    return NextResponse.json(persona, { status: 201 })
  } catch (error) {
    console.error("API: Error al crear persona:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


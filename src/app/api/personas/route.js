import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()

// GET /api/personas - Obtener personas con filtros opcionales
export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const tipoDocumento = searchParams.get("tipoDocumento")
    const numeroDocumento = searchParams.get("numeroDocumento")

    console.log("API: Consultando personas con filtros:", { tipoDocumento, numeroDocumento })

    // Construir la consulta base
    const whereClause = {
      deletedAt: null,
    }

    // Si se proporcionan parámetros de búsqueda, añadirlos al where
    if (tipoDocumento && numeroDocumento) {
      whereClause.idTipoDocumento = Number(tipoDocumento)
      whereClause.nroDocumento = {
        contains: numeroDocumento,
        mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
      }
    }

    // Ejecutar la consulta con los filtros aplicados
    const personas = await prisma.persona.findMany({
      where: whereClause,
      include: {
        tipoDocumento: true,
        ciudad: true,
      },
      orderBy: {
        apellido: "asc",
      },
    })

    console.log("API: Personas encontradas:", personas.length)

    // Devolver directamente el array de personas
    return NextResponse.json(personas, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener personas:", error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.internalServerError })
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
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar si ya existe una persona con el mismo tipo y número de documento
    const personaExistente = await prisma.persona.findFirst({
      where: {
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
        nroDocumento: data.nroDocumento,
        deletedAt: null, // Solo considerar personas activas
      },
      include: {
        tipoDocumento: true,
      },
    })

    if (personaExistente) {
      console.log(`Ya existe una persona con el documento ${data.nroDocumento}: ID ${personaExistente.idPersona}`)
      return NextResponse.json(
        {
          error: `Ya existe una persona registrada con el documento ${data.nroDocumento}`,
          personaExistente: {
            id: personaExistente.idPersona,
            nombre: `${personaExistente.nombre} ${personaExistente.apellido}`,
            tipoDocumento: personaExistente.tipoDocumento?.descTipoDocumento || "Documento",
          },
        },
        { status: HTTP_STATUS_CODES.conflict }, // 409 Conflict
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
    return NextResponse.json(persona, { status: HTTP_STATUS_CODES.created })
  } catch (error) {
    console.error("API: Error al crear persona:", error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}

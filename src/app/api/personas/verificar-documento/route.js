import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    console.log("API verificar-documento: Solicitud recibida")

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url)
    const nroDocumento = searchParams.get("nroDocumento")
    const idTipoDocumento = searchParams.get("idTipoDocumento")

    if (!nroDocumento || !idTipoDocumento) {
      return NextResponse.json({ message: "Número de documento y tipo de documento son requeridos" }, { status: 400 })
    }

    // Verificar si existe una persona con ese documento
    const persona = await prisma.persona.findFirst({
      where: {
        nroDocumento: nroDocumento,
        idTipoDocumento: Number.parseInt(idTipoDocumento),
        deletedAt: null,
      },
    })

    return NextResponse.json({
      existe: !!persona,
      persona: persona
        ? {
            idPersona: persona.idPersona,
            nombre: persona.nombre,
            apellido: persona.apellido,
          }
        : null,
    })
  } catch (error) {
    console.error("Error al verificar documento:", error)
    return NextResponse.json({ message: "Error al verificar documento", error: error.message }, { status: 500 })
  }
}


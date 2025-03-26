import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    console.log("API empresas: Solicitud GET recibida")

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
        { razonSocial: { contains: search, mode: "insensitive" } },
        { ruc: { contains: search, mode: "insensitive" } },
        { correoEmpresa: { contains: search, mode: "insensitive" } },
      ]
    }

    // Obtener todas las empresas
    const empresas = await prisma.empresa.findMany({
      where,
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
        tipoPersona: true,
        persona: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`API empresas: Se encontraron ${empresas.length} empresas`)
    return NextResponse.json({ empresas })
  } catch (error) {
    console.error("Error al obtener empresas:", error)
    return NextResponse.json({ message: "Error al obtener empresas", error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("API empresas: Solicitud POST recibida")

    const body = await request.json()
    console.log("Datos recibidos:", body)

    // Validar datos
    if (!body.razonSocial || !body.ruc) {
      return NextResponse.json({ message: "Razón social y RUC son requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una empresa con el mismo RUC
    const empresaExistente = await prisma.empresa.findFirst({
      where: {
        ruc: body.ruc,
        deletedAt: null,
      },
    })

    if (empresaExistente) {
      return NextResponse.json({ message: "Ya existe una empresa con este RUC" }, { status: 400 })
    }

    // Crear la empresa
    const empresa = await prisma.empresa.create({
      data: {
        razonSocial: body.razonSocial,
        idTipoPersona: Number.parseInt(body.idTipoPersona),
        idTipoDocumento: Number.parseInt(body.idTipoDocumento),
        ruc: body.ruc,
        direccionEmpresa: body.direccionEmpresa,
        idCiudad: Number.parseInt(body.idCiudad),
        correoEmpresa: body.correoEmpresa,
        telefono: body.telefono,
        personaContacto: Number.parseInt(body.personaContacto),
        idCategoriaEmpresa: Number.parseInt(body.idCategoriaEmpresa),
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
        tipoPersona: true,
        persona: true,
      },
    })

    console.log("Empresa creada:", empresa)
    return NextResponse.json({ message: "Empresa creada exitosamente", empresa }, { status: 201 })
  } catch (error) {
    console.error("Error al crear empresa:", error)
    return NextResponse.json({ message: "Error al crear empresa", error: error.message }, { status: 500 })
  }
}


import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
      where: {
        deletedAt: null,
      },
    })

    return NextResponse.json(empresas)
  } catch (error) {
    console.error("Error al obtener empresas:", error)
    return NextResponse.json({ error: "Error al obtener empresas" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()

    const empresa = await prisma.empresa.create({
      data: {
        idCategoriaEmpresa: Number.parseInt(data.idCategoriaEmpresa),
        razonSocial: data.razonSocial,
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
        ruc: data.ruc,
        direccionEmpresa: data.direccionEmpresa,
        idCiudad: Number.parseInt(data.idCiudad),
        correoEmpresa: data.correoEmpresa,
        telefono: data.telefono,
        personaContacto: Number.parseInt(data.personaContacto),
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al crear empresa:", error)
    return NextResponse.json({ error: "Error al crear empresa" }, { status: 500 })
  }
}


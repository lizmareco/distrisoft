import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    console.log("API verificar-ruc: Solicitud recibida")

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url)
    const ruc = searchParams.get("ruc")

    if (!ruc) {
      return NextResponse.json({ message: "RUC es requerido" }, { status: 400 })
    }

    // Verificar si existe una empresa con ese RUC
    const empresa = await prisma.empresa.findFirst({
      where: {
        ruc: ruc,
        deletedAt: null,
      },
    })

    return NextResponse.json({
      existe: !!empresa,
      empresa: empresa
        ? {
            idEmpresa: empresa.idEmpresa,
            razonSocial: empresa.razonSocial,
          }
        : null,
    })
  } catch (error) {
    console.error("Error al verificar RUC:", error)
    return NextResponse.json({ message: "Error al verificar RUC", error: error.message }, { status: 500 })
  }
}


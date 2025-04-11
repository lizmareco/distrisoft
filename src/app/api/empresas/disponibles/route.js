import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Obteniendo empresas disponibles (no clientes)...")

    // Obtener todas las empresas que NO son clientes
    const empresas = await prisma.empresa.findMany({
      where: {
        deletedAt: null,
        // Excluir empresas que ya son clientes
        NOT: {
          cliente: {
            some: {
              deletedAt: null,
            },
          },
        },
      },
      include: {
        tipoDocumento: true,
        ciudad: true,
        persona: true,
        categoriaEmpresa: true,
      },
      orderBy: {
        razonSocial: "asc",
      },
    })

    console.log(`Se encontraron ${empresas.length} empresas disponibles`)
    return NextResponse.json(empresas)
  } catch (error) {
    console.error("Error al obtener empresas disponibles:", error)
    return NextResponse.json({ error: "Error al obtener empresas disponibles" }, { status: 500 })
  }
}

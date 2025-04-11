import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Obteniendo personas disponibles (no clientes)...")

    // Obtener todas las personas que NO son clientes
    const personas = await prisma.persona.findMany({
      where: {
        deletedAt: null,
        // Excluir personas que ya son clientes
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
      },
      orderBy: {
        apellido: "asc",
      },
    })

    console.log(`Se encontraron ${personas.length} personas disponibles`)
    return NextResponse.json(personas)
  } catch (error) {
    console.error("Error al obtener personas disponibles:", error)
    return NextResponse.json({ error: "Error al obtener personas disponibles" }, { status: 500 })
  }
}

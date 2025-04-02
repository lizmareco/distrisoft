import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Obteniendo clientes...")
    const clientes = await prisma.cliente.findMany({
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
      where: {
        deletedAt: null,
      },
    })
    console.log(`Se encontraron ${clientes.length} clientes`)
    return NextResponse.json(clientes)
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("Creando nuevo cliente...")
    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idPersona || !data.idSectorCliente || !data.idCondicionPago) {
      console.error("Datos incompletos:", data)
      return NextResponse.json(
        { error: "Faltan datos requeridos (persona, sector o condición de pago)" },
        { status: 400 },
      )
    }

    const cliente = await prisma.cliente.create({
      data: {
        idPersona: Number.parseInt(data.idPersona),
        idSectorCliente: Number.parseInt(data.idSectorCliente),
        idCondicionPago: Number.parseInt(data.idCondicionPago),
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : null,
      },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    console.log("Cliente creado con ID:", cliente.idCliente)
    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return NextResponse.json({ error: `Error al crear cliente: ${error.message}` }, { status: 500 })
  }
}




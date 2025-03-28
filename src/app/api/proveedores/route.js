import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Obteniendo proveedores...")
    const proveedores = await prisma.proveedor.findMany({
      include: {
        empresa: true,
        condicionPago: true,
      },
      where: {
        deletedAt: null,
      },
    })
    console.log(`Se encontraron ${proveedores.length} proveedores`)
    return NextResponse.json(proveedores)
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("Creando nuevo proveedor...")
    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idEmpresa || !data.idCondicionPago) {
      console.error("Datos incompletos:", data)
      return NextResponse.json({ error: "Faltan datos requeridos (empresa o condición de pago)" }, { status: 400 })
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        idEmpresa: Number.parseInt(data.idEmpresa),
        idCondicionPago: Number.parseInt(data.idCondicionPago),
      },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    console.log("Proveedor creado con ID:", proveedor.idProveedor)
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error al crear proveedor:", error)
    return NextResponse.json({ error: `Error al crear proveedor: ${error.message}` }, { status: 500 })
  }
}


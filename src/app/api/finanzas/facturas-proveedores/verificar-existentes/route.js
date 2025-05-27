import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const { idsOrdenes } = await request.json()

    if (!idsOrdenes || !Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
      return NextResponse.json({ ordenesConFactura: [] })
    }

    // Buscar facturas existentes para estas órdenes
    const facturasExistentes = await prisma.facturaProveedor.findMany({
      where: {
        idOrdenCompra: {
          in: idsOrdenes,
        },
        deletedAt: null,
      },
      select: {
        idOrdenCompra: true,
      },
    })

    const ordenesConFactura = facturasExistentes.map((factura) => factura.idOrdenCompra)

    return NextResponse.json({
      success: true,
      ordenesConFactura,
    })
  } catch (error) {
    console.error("Error al verificar facturas existentes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        ordenesConFactura: [],
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

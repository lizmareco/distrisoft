import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const facturasCredito = await prisma.facturaClienteCredito.findMany({
      where: {
        deletedAt: null,
        saldoRestante: {
          gt: 0,
        },
      },
      include: {
        cliente: {
          include: {
            persona: true,
          },
        },
        estadoFactuCliente: true,
        detallePagoFacCliente: true,
      },
      orderBy: {
        fechaVencimiento: "asc",
      },
    })

    const cuentasPorCobrar = facturasCredito.map((factura) => {
      const fechaVencimiento = new Date(factura.fechaVencimiento)
      const hoy = new Date()
      const diasVencimiento = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24))

      const montoPagado = factura.detallePagoFacCliente.reduce((sum, pago) => sum + pago.montoPago, 0)

      return {
        nroFactura: factura.nroFacClienteCredito,
        cliente: `${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        montoTotal: Number.parseFloat(factura.montoTotalFactura),
        montoPagado,
        saldoRestante: factura.saldoRestante,
        diasVencimiento,
        estado: diasVencimiento < 0 ? "Vencida" : "Pendiente",
        pagos: factura.detallePagoFacCliente,
      }
    })

    return NextResponse.json({
      success: true,
      data: cuentasPorCobrar,
    })
  } catch (error) {
    console.error("Error al obtener cuentas por cobrar:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

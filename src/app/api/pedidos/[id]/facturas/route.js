import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    // Await params para Next.js 15
    const resolvedParams = await params
    const idPedido = Number.parseInt(resolvedParams.id)

    if (!idPedido || isNaN(idPedido)) {
      return NextResponse.json({ success: false, error: "ID de pedido inválido" }, { status: 400 })
    }

    // Verificar facturas de contado
    const facturasContado = await prisma.FacturaClienteContado.findMany({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      select: {
        nroFacClienteContado: true,
        fechaEmision: true,
        montoTotalFactura: true,
        estadoFactuCliente: {
          select: {
            descEstFactCliente: true,
          },
        },
        metodoPago: {
          select: {
            descMetodoPago: true,
          },
        },
      },
    })

    // Verificar facturas de crédito
    const facturasCredito = await prisma.facturaClienteCredito.findMany({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      select: {
        nroFacClienteCredito: true,
        fechaEmision: true,
        fechaVencimiento: true,
        montoTotalFactura: true,
        saldoRestante: true,
        estadoFactuCliente: {
          select: {
            descEstFactCliente: true,
          },
        },
      },
    })

    const tieneFacturas = facturasContado.length > 0 || facturasCredito.length > 0

    // Formatear facturas para respuesta
    const facturas = [
      ...facturasContado.map((f) => ({
        numero: f.nroFacClienteContado,
        tipo: "contado",
        fechaEmision: f.fechaEmision,
        monto: Number.parseFloat(f.montoTotalFactura),
        estado: f.estadoFactuCliente.descEstFactCliente,
        metodoPago: f.metodoPago?.descMetodoPago,
      })),
      ...facturasCredito.map((f) => ({
        numero: f.nroFacClienteCredito,
        tipo: "credito",
        fechaEmision: f.fechaEmision,
        fechaVencimiento: f.fechaVencimiento,
        monto: Number.parseFloat(f.montoTotalFactura),
        saldoRestante: f.saldoRestante,
        estado: f.estadoFactuCliente.descEstFactCliente,
      })),
    ]

    return NextResponse.json({
      success: true,
      tieneFacturas,
      cantidadFacturas: facturas.length,
      facturas,
    })
  } catch (error) {
    console.error("Error al verificar facturas del pedido:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

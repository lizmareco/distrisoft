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

    console.log(`Verificando facturas para pedido ${idPedido}`)

    // Verificar facturas usando el modelo FacturaCliente actualizado
    const facturas = await prisma.facturaCliente.findMany({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
      select: {
        nroFactura: true,
        fechaEmision: true,
        fechaVencimiento: true,
        montoTotalFactura: true,
        esContado: true,
        observacion: true,
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
        cuentaPorCobrar: {
          select: {
            saldoRestante: true,
            diasVencido: true,
          },
        },
      },
    })

    const tieneFacturas = facturas.length > 0

    console.log(`Pedido ${idPedido}: ${facturas.length} facturas encontradas`)

    // Formatear facturas para respuesta
    const facturasFormateadas = facturas.map((f) => ({
      numero: f.nroFactura,
      tipo: f.esContado ? "contado" : "credito",
      fechaEmision: f.fechaEmision,
      fechaVencimiento: f.fechaVencimiento,
      monto: Number.parseFloat(f.montoTotalFactura || 0),
      saldoRestante: f.cuentaPorCobrar?.saldoRestante ? Number.parseFloat(f.cuentaPorCobrar.saldoRestante) : null,
      diasVencido: f.cuentaPorCobrar?.diasVencido || 0,
      estado: f.estadoFactuCliente?.descEstFactCliente || "Emitida",
      metodoPago: f.metodoPago?.descMetodoPago || null,
      observacion: f.observacion || "",
    }))

    return NextResponse.json({
      success: true,
      tieneFacturas,
      cantidadFacturas: facturas.length,
      facturas: facturasFormateadas,
    })
  } catch (error) {
    console.error("Error al verificar facturas del pedido:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}

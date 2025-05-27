import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request, { params }) {
  try {
    const { nroFactura } = params

    if (!nroFactura) {
      return NextResponse.json({ success: false, error: "Número de factura requerido" }, { status: 400 })
    }

    const nroFacturaInt = Number.parseInt(nroFactura)

    if (isNaN(nroFacturaInt)) {
      return NextResponse.json({ success: false, error: "Número de factura inválido" }, { status: 400 })
    }

    // Obtener historial de pagos
    const pagos = await prisma.pagoFacturaCliente.findMany({
      where: {
        nroFactura: nroFacturaInt,
        deletedAt: null,
      },
      include: {
        metodoPago: true,
        usuario: {
          include: {
            persona: true,
          },
        },
        facturaCliente: {
          include: {
            cliente: {
              include: {
                persona: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaPago: "desc",
      },
    })

    // Formatear datos
    const historialFormateado = pagos.map((pago) => ({
      idPago: pago.idPago,
      fechaPago: pago.fechaPago,
      montoPago: Number.parseFloat(pago.montoPago),
      metodoPago: pago.metodoPago?.descMetodoPago || "Sin método",
      comprobantePago: pago.comprobantePago || "",
      observaciones: pago.observaciones || "",
      operador: pago.usuario?.persona
        ? `${pago.usuario.persona.nombre} ${pago.usuario.persona.apellido}`
        : "Operador desconocido",
      createdAt: pago.createdAt,
    }))

    // Calcular resumen
    const totalPagado = historialFormateado.reduce((sum, pago) => sum + pago.montoPago, 0)
    const cantidadPagos = historialFormateado.length

    // Obtener información de la factura
    const factura = pagos.length > 0 ? pagos[0].facturaCliente : null
    let infoFactura = null

    if (factura) {
      infoFactura = {
        nroFactura: factura.nroFactura,
        cliente: `${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
        montoTotal: Number.parseFloat(factura.montoTotalFactura),
        fechaEmision: factura.fechaEmision,
      }
    } else {
      // Si no hay pagos, obtener la factura directamente
      const facturaDirecta = await prisma.facturaCliente.findUnique({
        where: { nroFactura: nroFacturaInt },
        include: {
          cliente: {
            include: {
              persona: true,
            },
          },
        },
      })

      if (facturaDirecta) {
        infoFactura = {
          nroFactura: facturaDirecta.nroFactura,
          cliente: `${facturaDirecta.cliente.persona.nombre} ${facturaDirecta.cliente.persona.apellido}`,
          montoTotal: Number.parseFloat(facturaDirecta.montoTotalFactura),
          fechaEmision: facturaDirecta.fechaEmision,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        historial: historialFormateado,
        resumen: {
          totalPagado,
          cantidadPagos,
          ultimoPago: historialFormateado.length > 0 ? historialFormateado[0] : null,
        },
        factura: infoFactura,
      },
    })
  } catch (error) {
    console.error("Error al obtener historial de pagos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

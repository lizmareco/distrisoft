import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const data = await request.json()
    const {
      nroFacClienteCredito,
      montoPago,
      fechaPago,
      idMetodoPago,
      comprobantePago,
      observacion = "",
      operador = 1,
    } = data

    // Validaciones
    if (!nroFacClienteCredito || !montoPago || !fechaPago || !idMetodoPago) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    const nroFacturaInt = Number.parseInt(nroFacClienteCredito)
    const montoInt = Number.parseFloat(montoPago)
    const metodoPagoInt = Number.parseInt(idMetodoPago)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(nroFacturaInt) || isNaN(montoInt) || isNaN(metodoPagoInt) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "Valores inválidos" }, { status: 400 })
    }

    if (montoInt <= 0) {
      return NextResponse.json({ success: false, error: "El monto debe ser mayor a 0" }, { status: 400 })
    }

    // Verificar que la factura existe y tiene saldo pendiente
    const factura = await prisma.facturaClienteCredito.findUnique({
      where: { nroFacClienteCredito: nroFacturaInt },
      include: {
        cliente: { include: { persona: true } },
      },
    })

    if (!factura) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    if (factura.saldoRestante < montoInt) {
      return NextResponse.json(
        { success: false, error: "El monto del pago excede el saldo pendiente" },
        { status: 400 },
      )
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Registrar el pago
      const nuevoPago = await tx.detallePagoFacCliente.create({
        data: {
          nroFacClienteCredito: nroFacturaInt,
          fechaPago: new Date(fechaPago),
          montoPago: montoInt,
          idMetodoPago: metodoPagoInt,
          observacion,
          comprobantePago: comprobantePago || "",
        },
      })

      // Actualizar saldo restante de la factura
      const nuevoSaldo = factura.saldoRestante - montoInt
      const facturaActualizada = await tx.facturaClienteCredito.update({
        where: { nroFacClienteCredito: nroFacturaInt },
        data: {
          saldoRestante: nuevoSaldo,
          // Si el saldo llega a 0, cambiar estado a "Pagada"
          ...(nuevoSaldo === 0 && { idEstadoFactuCliente: 2 }),
          updatedAt: new Date(),
        },
      })

      return { nuevoPago, facturaActualizada, nuevoSaldo }
    })

    // Registrar auditoría del pago
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "DetallePagoFacCliente",
      resultado.nuevoPago.idPagoFactura,
      {
        nroFacClienteCredito: nroFacturaInt,
        cliente: `${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
        montoPago: montoInt,
        fechaPago,
        metodoPago: metodoPagoInt,
        comprobantePago,
        observacion,
        saldoAnterior: factura.saldoRestante,
        saldoNuevo: resultado.nuevoSaldo,
        descripcion: `Pago registrado para factura #${nroFacturaInt} - Cliente: ${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    // Si el saldo llegó a 0, registrar auditoría de actualización de factura
    if (resultado.nuevoSaldo === 0) {
      await auditoriaService.registrarActualizacion(
        "FacturaClienteCredito",
        nroFacturaInt,
        {
          saldoRestante: factura.saldoRestante,
          estado: "Pendiente",
        },
        {
          saldoRestante: 0,
          estado: "Pagada",
          descripcion: `Factura completamente pagada - Cliente: ${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
        },
        operadorInt,
        auditoriaService.obtenerDireccionIP(request),
        auditoriaService.obtenerInfoNavegador(request),
      )
    }

    return NextResponse.json({
      success: true,
      data: resultado.nuevoPago,
      saldoRestante: resultado.nuevoSaldo,
      message: "Pago registrado exitosamente",
    })
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nroFactura = searchParams.get("nroFactura")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    const whereClause = {
      deletedAt: null,
    }

    if (nroFactura) {
      whereClause.nroFacClienteCredito = Number.parseInt(nroFactura)
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fechaPago = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      }
    }

    const pagos = await prisma.detallePagoFacCliente.findMany({
      where: whereClause,
      include: {
        facturaClienteCredito: {
          include: {
            cliente: {
              include: {
                persona: true,
              },
            },
          },
        },
        metodoPago: true,
      },
      orderBy: {
        fechaPago: "desc",
      },
    })

    const pagosFormateados = pagos.map((pago) => ({
      idPago: pago.idPagoFactura,
      nroFactura: pago.nroFacClienteCredito,
      cliente: `${pago.facturaClienteCredito.cliente.persona.nombre} ${pago.facturaClienteCredito.cliente.persona.apellido}`,
      montoPago: pago.montoPago,
      fechaPago: pago.fechaPago,
      metodoPago: pago.metodoPago.descMetodoPago,
      comprobantePago: pago.comprobantePago,
      observacion: pago.observacion,
    }))

    return NextResponse.json({
      success: true,
      data: pagosFormateados,
    })
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

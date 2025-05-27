import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nroFactura = searchParams.get("nroFactura")
    const cliente = searchParams.get("cliente")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    // Parámetros de paginación
    const pagina = Number.parseInt(searchParams.get("pagina") || "1")
    const limite = Number.parseInt(searchParams.get("limite") || "10")
    const skip = (pagina - 1) * limite

    const whereClause = {
      deletedAt: null,
    }

    // Filtros
    if (nroFactura) {
      whereClause.nroFactura = Number.parseInt(nroFactura)
    }

    if (cliente) {
      whereClause.facturaCliente = {
        cliente: {
          persona: {
            OR: [
              { nombre: { contains: cliente, mode: "insensitive" } },
              { apellido: { contains: cliente, mode: "insensitive" } },
            ],
          },
        },
      }
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fechaPago = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      }
    }

    const pagos = await prisma.pagoFacturaCliente.findMany({
      where: whereClause,
      include: {
        facturaCliente: {
          include: {
            cliente: {
              include: {
                persona: true,
              },
            },
          },
        },
        cuentaPorCobrar: true,
        metodoPago: true,
        usuario: {
          include: {
            persona: true,
          },
        },
      },
      orderBy: {
        fechaPago: "desc",
      },
      skip,
      take: limite,
    })

    // Contar total
    const totalRegistros = await prisma.pagoFacturaCliente.count({
      where: whereClause,
    })

    const pagosFormateados = pagos.map((pago) => ({
      idPago: pago.idPago,
      nroFactura: pago.nroFactura,
      cliente: `${pago.facturaCliente.cliente.persona.nombre} ${pago.facturaCliente.cliente.persona.apellido}`,
      fechaPago: pago.fechaPago,
      montoPago: pago.montoPago,
      metodoPago: pago.metodoPago.descMetodoPago,
      comprobantePago: pago.comprobantePago,
      observaciones: pago.observaciones,
      operador: `${pago.usuario.persona.nombre} ${pago.usuario.persona.apellido}`,
      saldoRestante: pago.cuentaPorCobrar?.saldoRestante || 0,
    }))

    const totalPaginas = Math.ceil(totalRegistros / limite)

    return NextResponse.json({
      success: true,
      data: pagosFormateados,
      meta: {
        page: pagina,
        limit: limite,
        total: totalRegistros,
        totalPages: totalPaginas,
      },
    })
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { nroFactura, montoPago, idMetodoPago, comprobantePago = "", observaciones = "", operador = 1 } = data

    // Validaciones
    if (!nroFactura || !montoPago || !idMetodoPago) {
      return NextResponse.json({ success: false, error: "Faltan campos requeridos" }, { status: 400 })
    }

    const nroFacturaInt = Number.parseInt(nroFactura)
    const montoPagoFloat = Number.parseFloat(montoPago)
    const idMetodoPagoInt = Number.parseInt(idMetodoPago)
    const operadorInt = Number.parseInt(operador)

    if (isNaN(nroFacturaInt) || isNaN(montoPagoFloat) || isNaN(idMetodoPagoInt) || isNaN(operadorInt)) {
      return NextResponse.json({ success: false, error: "Valores inválidos" }, { status: 400 })
    }

    if (montoPagoFloat <= 0) {
      return NextResponse.json({ success: false, error: "El monto del pago debe ser mayor a cero" }, { status: 400 })
    }

    // Verificar que la factura existe y es a crédito
    const factura = await prisma.facturaCliente.findUnique({
      where: { nroFactura: nroFacturaInt },
      include: {
        cuentaPorCobrar: true,
        cliente: {
          include: {
            persona: true,
          },
        },
      },
    })

    if (!factura) {
      return NextResponse.json({ success: false, error: "Factura no encontrada" }, { status: 404 })
    }

    if (factura.esContado) {
      return NextResponse.json(
        { success: false, error: "No se pueden registrar pagos en facturas de contado" },
        { status: 400 },
      )
    }

    if (!factura.cuentaPorCobrar) {
      return NextResponse.json(
        { success: false, error: "No se encontró la cuenta por cobrar asociada" },
        { status: 404 },
      )
    }

    if (factura.cuentaPorCobrar.saldoRestante <= 0) {
      return NextResponse.json({ success: false, error: "Esta factura ya está completamente pagada" }, { status: 400 })
    }

    if (montoPagoFloat > factura.cuentaPorCobrar.saldoRestante) {
      return NextResponse.json(
        {
          success: false,
          error: `El monto del pago (${montoPagoFloat}) no puede ser mayor al saldo restante (${factura.cuentaPorCobrar.saldoRestante})`,
        },
        { status: 400 },
      )
    }

    // Registrar el pago en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // Crear el registro de pago
      const nuevoPago = await prisma.pagoFacturaCliente.create({
        data: {
          nroFactura: nroFacturaInt,
          idCuentaCobrar: factura.cuentaPorCobrar.idCuentaCobrar,
          fechaPago: new Date(),
          montoPago: montoPagoFloat,
          idMetodoPago: idMetodoPagoInt,
          comprobantePago,
          observaciones,
          operador: operadorInt,
        },
      })

      // Actualizar el saldo restante en la cuenta por cobrar
      const nuevoSaldoRestante = factura.cuentaPorCobrar.saldoRestante - montoPagoFloat

      await prisma.cuentaPorCobrar.update({
        where: { idCuentaCobrar: factura.cuentaPorCobrar.idCuentaCobrar },
        data: {
          saldoRestante: nuevoSaldoRestante,
          idEstadoCuenta: nuevoSaldoRestante <= 0 ? 3 : factura.cuentaPorCobrar.idEstadoCuenta, // 3 = Cobrada
          updatedAt: new Date(),
        },
      })

      // Si el saldo llega a 0, actualizar también el estado de la factura a "Cobrada"
      if (nuevoSaldoRestante <= 0) {
        await prisma.facturaCliente.update({
          where: { nroFactura: nroFacturaInt },
          data: {
            idEstadoFactuCliente: 3, // 3 = Cobrada
            updatedAt: new Date(),
          },
        })
      }

      return { nuevoPago, nuevoSaldoRestante }
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "PagoFacturaCliente",
      resultado.nuevoPago.idPago,
      {
        nroFactura: nroFacturaInt,
        cliente: `${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
        montoPago: montoPagoFloat,
        saldoAnterior: factura.cuentaPorCobrar.saldoRestante,
        nuevoSaldo: resultado.nuevoSaldoRestante,
        comprobantePago,
        observaciones,
        descripcion: `Pago registrado para factura #${nroFacturaInt} - Cliente: ${factura.cliente.persona.nombre} ${factura.cliente.persona.apellido}`,
      },
      operadorInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      data: {
        idPago: resultado.nuevoPago.idPago,
        montoPago: montoPagoFloat,
        nuevoSaldoRestante: resultado.nuevoSaldoRestante,
        fechaPago: resultado.nuevoPago.fechaPago,
      },
      message: "Pago registrado exitosamente",
    })
  } catch (error) {
    console.error("Error al registrar pago:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

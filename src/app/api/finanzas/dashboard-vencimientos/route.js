import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const en30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // 1. Resumen general
    const resumenGeneral = await prisma.cuentaPorCobrar.aggregate({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
      },
      _sum: {
        saldoRestante: true,
      },
      _count: {
        idCuentaCobrar: true,
      },
    })

    // 2. Facturas vencidas
    const facturasVencidas = await prisma.cuentaPorCobrar.aggregate({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
        fechaVencimiento: { lt: hoy },
      },
      _sum: {
        saldoRestante: true,
      },
      _count: {
        idCuentaCobrar: true,
      },
    })

    // 3. Facturas que vencen en 7 días
    const vencenEn7Dias = await prisma.cuentaPorCobrar.aggregate({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
        fechaVencimiento: {
          gte: hoy,
          lte: en7Dias,
        },
      },
      _sum: {
        saldoRestante: true,
      },
      _count: {
        idCuentaCobrar: true,
      },
    })

    // 4. Monto cobrado este mes
    const cobradoEsteMes = await prisma.pagoFacturaCliente.aggregate({
      where: {
        deletedAt: null,
        fechaPago: {
          gte: inicioMes,
          lte: hoy,
        },
      },
      _sum: {
        montoPago: true,
      },
    })

    // 5. Facturas próximas a vencer (30 días)
    const proximasVencer = await prisma.cuentaPorCobrar.findMany({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
        fechaVencimiento: {
          gte: hoy,
          lte: en30Dias,
        },
      },
      include: {
        cliente: {
          include: {
            persona: true,
          },
        },
        estadoCuenta: true,
        pagos: {
          orderBy: {
            fechaPago: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        fechaVencimiento: "asc",
      },
      take: 20,
    })

    // 6. Facturas vencidas detalladas
    const facturasVencidasDetalle = await prisma.cuentaPorCobrar.findMany({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
        fechaVencimiento: { lt: hoy },
      },
      include: {
        cliente: {
          include: {
            persona: true,
          },
        },
        estadoCuenta: true,
        pagos: {
          orderBy: {
            fechaPago: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        diasVencido: "desc",
      },
      take: 20,
    })

    // 7. Generar alertas
    const alertas = []

    if (facturasVencidas._count.idCuentaCobrar > 0) {
      alertas.push({
        tipo: "error",
        mensaje: `Tienes ${facturasVencidas._count.idCuentaCobrar} facturas vencidas por ₲ ${facturasVencidas._sum.saldoRestante.toLocaleString("es-PY")}`,
      })
    }

    if (vencenEn7Dias._count.idCuentaCobrar > 0) {
      alertas.push({
        tipo: "warning",
        mensaje: `${vencenEn7Dias._count.idCuentaCobrar} facturas vencen en los próximos 7 días`,
      })
    }

    // Formatear datos
    const proximasVencerFormateadas = proximasVencer.map((cuenta) => ({
      nroFactura: cuenta.nroFactura,
      cliente: `${cuenta.cliente.persona.nombre} ${cuenta.cliente.persona.apellido}`,
      fechaVencimiento: cuenta.fechaVencimiento,
      diasParaVencer: Math.ceil((cuenta.fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)),
      saldoRestante: cuenta.saldoRestante,
      estadoCuenta: cuenta.estadoCuenta.descEstadoCuenta,
      ultimoPago: cuenta.pagos[0] || null,
    }))

    const facturasVencidasFormateadas = facturasVencidasDetalle.map((cuenta) => ({
      nroFactura: cuenta.nroFactura,
      cliente: `${cuenta.cliente.persona.nombre} ${cuenta.cliente.persona.apellido}`,
      fechaVencimiento: cuenta.fechaVencimiento,
      diasVencido: cuenta.diasVencido,
      saldoRestante: cuenta.saldoRestante,
      estadoCuenta: cuenta.estadoCuenta.descEstadoCuenta,
      ultimoPago: cuenta.pagos[0] || null,
    }))

    const resumen = {
      totalPorCobrar: resumenGeneral._sum.saldoRestante || 0,
      totalCuentas: resumenGeneral._count.idCuentaCobrar || 0,
      facturasVencidas: facturasVencidas._count.idCuentaCobrar || 0,
      montoVencido: facturasVencidas._sum.saldoRestante || 0,
      vencenEn7Dias: vencenEn7Dias._count.idCuentaCobrar || 0,
      montoVenceEn7Dias: vencenEn7Dias._sum.saldoRestante || 0,
      cobradoEsteMes: cobradoEsteMes._sum.montoPago || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        resumen,
        alertas,
        proximasVencer: proximasVencerFormateadas,
        facturasVencidas: facturasVencidasFormateadas,
      },
    })
  } catch (error) {
    console.error("Error al obtener dashboard de vencimientos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") // "vigente", "vencida", "cobrada"
    const cliente = searchParams.get("cliente")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    // Parámetros de paginación
    const pagina = Number.parseInt(searchParams.get("pagina") || "1")
    const limite = Number.parseInt(searchParams.get("limite") || "10")
    const skip = (pagina - 1) * limite

    const whereClause = {
      deletedAt: null,
      saldoRestante: {
        gt: 0, // Solo cuentas con saldo pendiente
      },
    }

    // Filtros
    if (estado) {
      whereClause.estadoCuenta = {
        descEstadoCuenta: estado,
      }
    }

    if (cliente) {
      whereClause.cliente = {
        persona: {
          OR: [
            { nombre: { contains: cliente, mode: "insensitive" } },
            { apellido: { contains: cliente, mode: "insensitive" } },
          ],
        },
      }
    }

    if (fechaDesde && fechaHasta) {
      whereClause.fechaVencimiento = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      }
    }

    // Actualizar días vencidos antes de consultar
    await actualizarDiasVencidos()

    const cuentasPorCobrar = await prisma.cuentaPorCobrar.findMany({
      where: whereClause,
      include: {
        facturaCliente: {
          include: {
            estadoFactuCliente: true,
          },
        },
        cliente: {
          include: {
            persona: true,
          },
        },
        estadoCuenta: true,
        pagos: {
          include: {
            metodoPago: true,
          },
          orderBy: {
            fechaPago: "desc",
          },
        },
      },
      orderBy: {
        fechaVencimiento: "asc",
      },
      skip,
      take: limite,
    })

    // Contar total
    const totalRegistros = await prisma.cuentaPorCobrar.count({
      where: whereClause,
    })

    const cuentasFormateadas = cuentasPorCobrar.map((cuenta) => ({
      idCuentaCobrar: cuenta.idCuentaCobrar,
      nroFactura: cuenta.nroFactura,
      cliente: `${cuenta.cliente.persona.nombre} ${cuenta.cliente.persona.apellido}`,
      fechaEmision: cuenta.facturaCliente.fechaEmision,
      fechaVencimiento: cuenta.fechaVencimiento,
      montoOriginal: cuenta.montoOriginal,
      saldoRestante: cuenta.saldoRestante,
      diasVencido: cuenta.diasVencido,
      estadoCuenta: cuenta.estadoCuenta.descEstadoCuenta,
      estadoFactura: cuenta.facturaCliente.estadoFactuCliente.descEstFactCliente,
      totalPagos: cuenta.pagos.reduce((sum, pago) => sum + pago.montoPago, 0),
      ultimoPago:
        cuenta.pagos.length > 0
          ? {
              fecha: cuenta.pagos[0].fechaPago,
              monto: cuenta.pagos[0].montoPago,
              metodoPago: cuenta.pagos[0].metodoPago.descMetodoPago,
            }
          : null,
    }))

    const totalPaginas = Math.ceil(totalRegistros / limite)

    // Calcular resúmenes
    const resumen = await calcularResumenCuentasPorCobrar()

    return NextResponse.json({
      success: true,
      data: cuentasFormateadas,
      meta: {
        page: pagina,
        limit: limite,
        total: totalRegistros,
        totalPages: totalPaginas,
      },
      resumen,
    })
  } catch (error) {
    console.error("Error al obtener cuentas por cobrar:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// Función auxiliar para actualizar días vencidos
async function actualizarDiasVencidos() {
  const hoy = new Date()

  await prisma.cuentaPorCobrar.updateMany({
    where: {
      deletedAt: null,
      saldoRestante: { gt: 0 },
    },
    data: {
      diasVencido: {
        // Calcular días vencidos (negativo si aún no vence, positivo si ya venció)
        set: prisma.$queryRaw`EXTRACT(DAY FROM (CURRENT_DATE - fecha_vencimiento))`,
      },
    },
  })

  // Actualizar estados según días vencidos
  await prisma.cuentaPorCobrar.updateMany({
    where: {
      deletedAt: null,
      saldoRestante: { gt: 0 },
      diasVencido: { gt: 0 },
      idEstadoCuenta: 1, // Vigente
    },
    data: {
      idEstadoCuenta: 2, // Vencida
    },
  })
}

// Función auxiliar para calcular resumen
async function calcularResumenCuentasPorCobrar() {
  const resumen = await prisma.cuentaPorCobrar.aggregate({
    where: {
      deletedAt: null,
      saldoRestante: { gt: 0 },
    },
    _sum: {
      saldoRestante: true,
      montoOriginal: true,
    },
    _count: {
      idCuentaCobrar: true,
    },
  })

  const vencidas = await prisma.cuentaPorCobrar.aggregate({
    where: {
      deletedAt: null,
      saldoRestante: { gt: 0 },
      diasVencido: { gt: 0 },
    },
    _sum: {
      saldoRestante: true,
    },
    _count: {
      idCuentaCobrar: true,
    },
  })

  return {
    totalPorCobrar: resumen._sum.saldoRestante || 0,
    totalOriginal: resumen._sum.montoOriginal || 0,
    totalCuentas: resumen._count.idCuentaCobrar || 0,
    cuentasVencidas: vencidas._count.idCuentaCobrar || 0,
    montoVencido: vencidas._sum.saldoRestante || 0,
  }
}

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") // "vigente", "vencida", "cobrada", "cancelada"
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
    if (estado) {
      const estadoMap = {
        vigente: 1,
        vencida: 2,
        cobrada: 3,
        cancelada: 4,
      }
      whereClause.idEstadoCuenta = estadoMap[estado.toLowerCase()]
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

  // Obtener todas las cuentas por cobrar activas
  const cuentas = await prisma.cuentaPorCobrar.findMany({
    where: {
      deletedAt: null,
      idEstadoCuenta: { in: [1, 2] }, // Solo vigentes y vencidas
    },
  })

  // Actualizar cada cuenta individualmente
  for (const cuenta of cuentas) {
    const fechaVencimiento = new Date(cuenta.fechaVencimiento)
    const diferenciaDias = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24))

    let nuevoEstadoCuenta = cuenta.idEstadoCuenta
    let nuevoEstadoFactura = null

    // Determinar nuevo estado basado en días vencidos y saldo
    if (cuenta.saldoRestante <= 0) {
      nuevoEstadoCuenta = 3 // Cobrada
      nuevoEstadoFactura = 3 // Factura también cobrada
    } else if (diferenciaDias > 0 && cuenta.idEstadoCuenta === 1) {
      nuevoEstadoCuenta = 2 // Vencida
    }

    // Actualizar cuenta por cobrar
    await prisma.cuentaPorCobrar.update({
      where: { idCuentaCobrar: cuenta.idCuentaCobrar },
      data: {
        diasVencido: diferenciaDias,
        idEstadoCuenta: nuevoEstadoCuenta,
        updatedAt: new Date(),
      },
    })

    // Actualizar factura si es necesario
    if (nuevoEstadoFactura) {
      await prisma.facturaCliente.update({
        where: { nroFactura: cuenta.nroFactura },
        data: {
          idEstadoFactuCliente: nuevoEstadoFactura,
          updatedAt: new Date(),
        },
      })
    }
  }
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

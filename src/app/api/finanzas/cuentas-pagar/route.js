import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado")
    const proveedor = searchParams.get("proveedor")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    // Parámetros de paginación
    const pagina = Number.parseInt(searchParams.get("pagina") || "1")
    const limite = Number.parseInt(searchParams.get("limite") || "10")
    const skip = (pagina - 1) * limite

    const whereClause = {
      deletedAt: null,
      facturaProveedor: {
        esContado: false, // Solo facturas a crédito (cuentas por pagar)
      },
    }

    // Filtros
    if (estado) {
      const estadoMap = {
        vigente: 1,
        vencida: 2,
        pagada: 3,
        cancelada: 4,
      }
      whereClause.idEstadoCuenta = estadoMap[estado.toLowerCase()]
    }

    if (proveedor) {
      whereClause.facturaProveedor = {
        ...whereClause.facturaProveedor,
        proveedor: {
          empresa: {
            razonSocial: { contains: proveedor, mode: "insensitive" },
          },
        },
      }
    }

    if (fechaDesde && fechaHasta) {
      whereClause.facturaProveedor = {
        ...whereClause.facturaProveedor,
        fechaEmision: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta),
        },
      }
    }

    // Actualizar días vencidos antes de consultar
    await actualizarDiasVencidos()

    const cuentasPorPagar = await prisma.cuentaPorPagar.findMany({
      where: whereClause,
      include: {
        facturaProveedor: {
          include: {
            estadoFacturaProv: true,
            proveedor: {
              include: {
                empresa: true,
              },
            },
            ordenCompra: true,
          },
        },
        estadoCuenta: true,
        pagosFacturaProveedor: {
          include: {
            metodoPago: true,
          },
          orderBy: {
            fechaPago: "desc",
          },
        },
      },
      orderBy: {
        facturaProveedor: {
          fechaEmision: "desc",
        },
      },
      skip,
      take: limite,
    })

    // Contar total
    const totalRegistros = await prisma.cuentaPorPagar.count({
      where: whereClause,
    })

    const cuentasFormateadas = cuentasPorPagar.map((cuenta) => ({
      idCuentaPagar: cuenta.idCuentaPagar,
      idFacturaProveedor: cuenta.idFacturaProveedor,
      nroFactura: cuenta.facturaProveedor.nroFactura,
      proveedor: cuenta.facturaProveedor.proveedor.empresa.razonSocial,
      fechaEmision: cuenta.facturaProveedor.fechaEmision,
      fechaVencimiento: cuenta.fechaVencimiento,
      montoOriginal: cuenta.montoOriginal,
      montoPagado: cuenta.montoPagado,
      saldoRestante: cuenta.saldoRestante,
      diasVencido: cuenta.diasVencido,
      estadoCuenta: cuenta.estadoCuenta.descEstadoCuenta,
      estadoFactura: cuenta.facturaProveedor.estadoFacturaProv.descEstadoFacturaProv,
      ordenCompra: cuenta.facturaProveedor.ordenCompra?.idOrdenCompra,
      totalPagos: cuenta.pagosFacturaProveedor.reduce((sum, pago) => sum + pago.montoPago, 0),
      ultimoPago:
        cuenta.pagosFacturaProveedor.length > 0
          ? {
              fecha: cuenta.pagosFacturaProveedor[0].fechaPago,
              monto: cuenta.pagosFacturaProveedor[0].montoPago,
              metodoPago: cuenta.pagosFacturaProveedor[0].metodoPago.descMetodoPago,
            }
          : null,
    }))

    const totalPaginas = Math.ceil(totalRegistros / limite)

    // Calcular resúmenes
    const resumen = await calcularResumenCuentasPorPagar()

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
    console.error("Error al obtener cuentas por pagar:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

// Función auxiliar para actualizar días vencidos
async function actualizarDiasVencidos() {
  try {
    const hoy = new Date()

    // Obtener todas las cuentas por pagar activas
    const cuentas = await prisma.cuentaPorPagar.findMany({
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

      // Determinar nuevo estado basado en días vencidos y saldo
      if (cuenta.saldoRestante <= 0) {
        nuevoEstadoCuenta = 3 // Pagada
      } else if (diferenciaDias > 0 && cuenta.idEstadoCuenta === 1) {
        nuevoEstadoCuenta = 2 // Vencida
      }

      // Actualizar cuenta por pagar si hay cambios
      if (nuevoEstadoCuenta !== cuenta.idEstadoCuenta || diferenciaDias !== cuenta.diasVencido) {
        await prisma.cuentaPorPagar.update({
          where: { idCuentaPagar: cuenta.idCuentaPagar },
          data: {
            diasVencido: diferenciaDias,
            idEstadoCuenta: nuevoEstadoCuenta,
            updatedAt: new Date(),
          },
        })
      }

      // Actualizar factura si la cuenta está pagada
      if (nuevoEstadoCuenta === 3) {
        await prisma.facturaProveedor.update({
          where: { idFacturaProveedor: cuenta.idFacturaProveedor },
          data: {
            idEstadoFacturaProv: 3, // Pagada
            updatedAt: new Date(),
          },
        })
      }
    }
  } catch (error) {
    console.error("Error al actualizar días vencidos:", error)
  }
}

// Función auxiliar para calcular resumen
async function calcularResumenCuentasPorPagar() {
  try {
    const resumen = await prisma.cuentaPorPagar.aggregate({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
      },
      _sum: {
        saldoRestante: true,
        montoOriginal: true,
      },
      _count: {
        idCuentaPagar: true,
      },
    })

    const vencidas = await prisma.cuentaPorPagar.aggregate({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
        diasVencido: { gt: 0 },
      },
      _sum: {
        saldoRestante: true,
      },
      _count: {
        idCuentaPagar: true,
      },
    })

    return {
      totalPorPagar: resumen._sum.saldoRestante || 0,
      totalOriginal: resumen._sum.montoOriginal || 0,
      totalCuentas: resumen._count.idCuentaPagar || 0,
      cuentasVencidas: vencidas._count.idCuentaPagar || 0,
      montoVencido: vencidas._sum.saldoRestante || 0,
    }
  } catch (error) {
    console.error("Error al calcular resumen:", error)
    return {
      totalPorPagar: 0,
      totalOriginal: 0,
      totalCuentas: 0,
      cuentasVencidas: 0,
      montoVencido: 0,
    }
  }
}

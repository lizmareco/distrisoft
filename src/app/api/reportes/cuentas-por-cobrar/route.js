import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client" // Ajusta la ruta si es necesario

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    // Filtro dinámico
    const where = {
      idEstadoCuenta: { in: [1, 2] },
      deletedAt: null,
      facturaCliente: {},
    }
    if (fechaDesde) where.facturaCliente.fechaEmision = { gte: new Date(fechaDesde) }
    if (fechaHasta) {
      where.facturaCliente.fechaEmision = {
        ...(where.facturaCliente.fechaEmision || {}),
        lte: new Date(fechaHasta),
      }
    }

    // Consulta Prisma
    const cuentas = await prisma.cuentaPorCobrar.findMany({
      where,
      include: {
        estadoCuenta: true, // EstadoCuentaCobrar
        cliente: {
          include: {
            persona: true, // Persona
          },
        },
        facturaCliente: true, // FacturaCliente
      },
      orderBy: { fechaVencimiento: "asc" },
    })

    // Procesar resultado
    const result = cuentas.map((c) => {
      const hoy = new Date()
      const fechaVenc = c.fechaVencimiento
      let dias_vencidos = 0
      if (fechaVenc && hoy > fechaVenc) {
        const diff = hoy - fechaVenc
        dias_vencidos = Math.floor(diff / (1000 * 60 * 60 * 24))
      }
      return {
        id_cuenta_cobrar: c.idCuentaCobrar,
        nro_factura: c.nroFactura,
        nro_documento: c.cliente?.persona?.nroDocumento,
        nombre: c.cliente?.persona?.nombre,
        apellido: c.cliente?.persona?.apellido,
        monto_original: c.montoOriginal,
        saldo_restante: c.saldoRestante,
        fecha_emision: c.facturaCliente?.fechaEmision?.toISOString().slice(0, 10),
        fecha_vencimiento: c.fechaVencimiento?.toISOString().slice(0, 10),
        plazo_pago: c.facturaCliente?.plazoPago,
        dias_vencidos,
        desc_estado_cuenta: c.estadoCuenta?.descEstadoCuenta,
        // Puedes agregar más campos de FacturaCliente si necesitas
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener cuentas por cobrar" }, { status: 500 })
  }
}
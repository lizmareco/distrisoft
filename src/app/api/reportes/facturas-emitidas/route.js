import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function POST(req) {
    try {
        const { fechaDesde, fechaHasta, estado } = await req.json()

        // Consulta Prisma adaptada a tu esquema
        const facturas = await prisma.facturaCliente.findMany({
            where: {
                fechaEmision: {
                    gte: new Date(fechaDesde),
                    lte: new Date(fechaHasta),
                },
                idEstadoFactuCliente: estado,
            },
            select: {
                nroFactura: true,
                fechaEmision: true,
                pedidoCliente: {
                    select: { idPedido: true }
                },
                cliente: {
                    select: {
                        persona: {
                            select: {
                                nroDocumento: true,
                                nombre: true,
                                apellido: true,
                            }
                        }
                    }
                },
                usuario: { // O el nombre correcto de la relación a usuario
                    select: { nombreUsuario: true }
                },
                impuestos: {
                    select: { descImpuesto: true }
                },
                montoTotalFactura: true,
                estadoFactuCliente: {
                    select: { descEstFactCliente: true }
                },
                esContado: true,
                metodoPago: {
                    select: { descMetodoPago: true }
                },
                plazoPago: true,
                fechaVencimiento: true,
            }
        })

        // Adaptar los datos al formato esperado por el frontend
        const data = facturas.map(f => ({
            NRO_FACTURA: f.nroFactura,
            FECHA_EMISION: f.fechaEmision?.toISOString().slice(0, 10),
            NRO_DOCUMENTO: f.cliente?.persona?.nroDocumento || "",
            NOMBRE: f.cliente?.persona?.nombre || "",
            APELLIDO: f.cliente?.persona?.apellido || "",
            ID_PEDIDO: f.pedidoCliente?.idPedido || "",
            USUARIO: f.usuario?.nombreUsuario || "",
            IMPUESTO: f.impuestos?.descImpuesto || "",
            MONTO_TOTAL: f.montoTotalFactura,
            ESTADO_FACTURA: f.estadoFactuCliente?.descEstFactCliente || "",
            ES_CONTADO: f.esContado,
            METODO_PAGO: f.metodoPago?.descMetodoPago || "Pago a Credito",
            PLAZO_PAGO: f.plazoPago,
            FECHA_VENCIMIENTO: f.fechaVencimiento?.toISOString().slice(0, 10),
        }))

        return NextResponse.json({ ok: true, data })
    } catch (error) {
        console.error("Error en facturas-emitidas:", error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}
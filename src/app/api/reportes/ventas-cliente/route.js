import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nroDocumento = searchParams.get("nroDocumento")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")
    const tipo = searchParams.get("tipo") || "detallado"

    console.log("Parámetros recibidos:", { nroDocumento, fechaDesde, fechaHasta, tipo })

    if (!nroDocumento || !fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Convertir fechas
    const fechaDesdeObj = new Date(fechaDesde + "T00:00:00.000Z")
    const fechaHastaObj = new Date(fechaHasta + "T23:59:59.999Z")

    if (tipo === "detallado") {
      // Consulta para datos detallados usando nombres correctos de Prisma
      const ventasDetalladas = await prisma.pedidoCliente.findMany({
        where: {
          idEstadoPedido: 5, // Estado completado - usando camelCase
          deletedAt: null, // usando camelCase
          fechaPedido: {
            // usando camelCase
            gte: fechaDesdeObj,
            lte: fechaHastaObj,
          },
          cliente: {
            persona: {
              nroDocumento: nroDocumento, // usando camelCase
            },
          },
        },
        include: {
          cliente: {
            include: {
              persona: true,
            },
          },
          usuario: true,
          estadoPedido: true,
        },
        orderBy: {
          fechaPedido: "asc", // usando camelCase
        },
      })

      console.log(`Encontradas ${ventasDetalladas.length} ventas`)

      // Formatear datos para que coincidan con el SQL original
      const datosFormateados = ventasDetalladas.map((venta) => ({
        NRO_DOCUMENTO: venta.cliente.persona.nroDocumento,
        NOMBRE: venta.cliente.persona.nombre,
        APELLIDO: venta.cliente.persona.apellido,
        ID_VENTA: venta.idPedido,
        MONTO_TOTAL: Number.parseFloat(venta.montoTotal),
        FECHA_VENTA: venta.fechaPedido.toISOString().split("T")[0],
        VENDEDOR: venta.usuario.nombreUsuario,
      }))

      return NextResponse.json(datosFormateados)
    } else if (tipo === "agrupado") {
      // Para datos agrupados, usaremos una consulta SQL raw ya que es más eficiente
      const ventasAgrupadas = await prisma.$queryRaw`
        SELECT 
          CONCAT(p.nombre, ' ', p.apellido) as cliente,
          SUM(CAST(pc.monto_total AS DECIMAL)) as "totalVenta",
          TO_CHAR(pc.fecha_pedido, 'YYYY-MM-DD') as fecha
        FROM "PedidoCliente" pc
        INNER JOIN "Cliente" c ON c.id_cliente = pc.id_cliente
        INNER JOIN "Persona" p ON c.id_persona = p.id_persona
        INNER JOIN "EstadoPedido" ep ON ep.id_estado_pedido = pc.id_estado_pedido
        INNER JOIN "Usuario" u ON u.id_usuario = pc.vendedor
        WHERE 
          pc.id_estado_pedido = 5 
          AND pc.deleted_at IS NULL 
          AND pc.fecha_pedido BETWEEN ${fechaDesdeObj} AND ${fechaHastaObj}
          AND p.nro_documento = ${nroDocumento}
        GROUP BY CONCAT(p.nombre, ' ', p.apellido), TO_CHAR(pc.fecha_pedido, 'YYYY-MM-DD')
        ORDER BY TO_CHAR(pc.fecha_pedido, 'YYYY-MM-DD')
      `

      console.log(`Encontrados ${ventasAgrupadas.length} registros agrupados`)

      // Convertir BigInt a Number para JSON
      const datosFormateados = ventasAgrupadas.map((item) => ({
        cliente: item.cliente,
        totalVenta: Number.parseFloat(item.totalVenta),
        fecha: item.fecha,
      }))

      return NextResponse.json(datosFormateados)
    }

    return NextResponse.json({ error: "Tipo de consulta no válido" }, { status: 400 })
  } catch (error) {
    console.error("Error en reporte de ventas por cliente:", error)
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 })
  }
}

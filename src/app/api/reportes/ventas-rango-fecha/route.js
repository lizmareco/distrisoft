import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  console.log("Reporte de ventas por rango de fecha")

  const { searchParams } = new URL(request.url)
  const fechaDesde = searchParams.get("fechaDesde")
  const fechaHasta = searchParams.get("fechaHasta")

  console.log("Parámetros recibidos:", { fechaDesde, fechaHasta })

  if (!fechaDesde || !fechaHasta) {
    return NextResponse.json({ error: "Las fechas desde y hasta son requeridas" }, { status: 400 })
  }

  try {
    const fechaDesdeObj = new Date(fechaDesde + "T00:00:00.000Z")
    const fechaHastaObj = new Date(fechaHasta + "T23:59:59.999Z")

    console.log("Fechas convertidas:", { fechaDesdeObj, fechaHastaObj })

    const ventas = await prisma.pedidoCliente.findMany({
      where: {
        idEstadoPedido: 5, // Estado completado
        deletedAt: null,
        fechaPedido: {
          gte: fechaDesdeObj,
          lte: fechaHastaObj,
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
        fechaPedido: "asc",
      },
    })

    console.log(`Encontradas ${ventas.length} ventas`)

    // Mapear los resultados y formatear la fecha correctamente SIN problemas de zona horaria
    const ventasMapeadas = ventas.map((venta) => {
      // Usar toISOString() y split para evitar problemas de zona horaria
      const fechaISO = venta.fechaPedido.toISOString().split("T")[0] // Obtiene YYYY-MM-DD
      const [año, mes, dia] = fechaISO.split("-")
      const fechaFormateada = `${dia}-${mes}-${año}` // Convertir a DD-MM-YYYY

      console.log("Fecha original:", venta.fechaPedido)
      console.log("Fecha ISO:", fechaISO)
      console.log("Fecha formateada:", fechaFormateada)

      return {
        ID_PEDIDO: venta.idPedido,
        DOC_CLIENTE: venta.cliente?.persona?.nroDocumento || "N/A",
        NOMBRE: venta.cliente?.persona?.nombre || "N/A",
        APELLIDO: venta.cliente?.persona?.apellido || "N/A",
        ID_VENTA: venta.idPedido,
        MONTO_TOTAL: venta.montoTotal,
        FECHA_VENTA: fechaFormateada,
        VENDEDOR: venta.usuario?.nombreUsuario || "N/A",
      }
    })

    console.log("Ventas mapeadas (primeras 3):", ventasMapeadas.slice(0, 3))

    return NextResponse.json(ventasMapeadas)
  } catch (error) {
    console.error("Error en reporte de ventas por rango de fecha:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

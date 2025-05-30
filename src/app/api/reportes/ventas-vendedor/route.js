import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
  console.log("Reporte de ventas por vendedor")

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

    // Obtener ventas por vendedor con información completa usando Prisma
    const ventasVendedor = await prisma.pedidoCliente.findMany({
      where: {
        idEstadoPedido: 5, // Estado completado
        deletedAt: null,
        fechaPedido: {
          gte: fechaDesdeObj,
          lte: fechaHastaObj,
        },
        // Quitamos la condición vendedor: { not: null } que causaba el error
      },
      include: {
        usuario: {
          select: {
            nombreUsuario: true,
            persona: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    })

    console.log("Ventas encontradas:", ventasVendedor.length)

    // Agrupar manualmente por vendedor
    const ventasAgrupadas = {}

    ventasVendedor.forEach((venta) => {
      const vendedorUser = venta.usuario?.nombreUsuario || "Sin vendedor"
      const nombre = venta.usuario?.persona?.nombre || ""
      const apellido = venta.usuario?.persona?.apellido || ""

      // Usar el nombre de usuario como clave para agrupar
      if (!ventasAgrupadas[vendedorUser]) {
        ventasAgrupadas[vendedorUser] = {
          VENDEDOR_USER: vendedorUser,
          NOMBRE: nombre,
          APELLIDO: apellido,
          TOTAL_VENDIDO: 0,
          CANTIDAD_VENTAS: 0,
        }
      }

      ventasAgrupadas[vendedorUser].TOTAL_VENDIDO += venta.montoTotal || 0
      ventasAgrupadas[vendedorUser].CANTIDAD_VENTAS += 1
    })

    // Convertir a array y ordenar por total vendido descendente
    const ventasMapeadas = Object.values(ventasAgrupadas).sort((a, b) => b.TOTAL_VENDIDO - a.TOTAL_VENDIDO)

    console.log("Ventas agrupadas:", ventasMapeadas)

    return NextResponse.json(ventasMapeadas)
  } catch (error) {
    console.error("Error en reporte de ventas por vendedor:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

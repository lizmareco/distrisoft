import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET(request) {
    try {
        // Obtener parámetros de fecha
        const { searchParams } = new URL(request.url)
        const fechaDesde = searchParams.get("fechaDesde") 
        const fechaHasta = searchParams.get("fechaHasta") 

        // Validar que ambos parámetros estén presentes
        if (!fechaDesde || !fechaHasta) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Debe especificar los parámetros 'fechaDesde' y 'fechaHasta' en la consulta.",
                },
                { status: 400 }
            )
        }
        console.log("Reporte de productos más vendidos")
        console.log("Parámetros recibidos:", { fechaDesde, fechaHasta })

        // Convertir fechas a objetos Date
        const fechaDesdeObj = new Date(fechaDesde + "T00:00:00.000Z")
        const fechaHastaObj = new Date(fechaHasta + "T23:59:59.999Z")

        console.log("Fechas convertidas:", {
            fechaDesdeObj,
            fechaHastaObj,
        })

        // Obtener pedidos completados en el rango de fechas
        const pedidos = await prisma.pedidoCliente.findMany({
            where: {
                idEstadoPedido: 5, // Estado completado
                deletedAt: null,
                fechaPedido: {
                    gte: fechaDesdeObj,
                    lte: fechaHastaObj,
                },
            },
            include: {
                pedidoDetalle: {
                    include: {
                        producto: true,
                    },
                },
            },
        })

        console.log(`Encontrados ${pedidos.length} pedidos`)

        // Agrupar por producto y sumar subtotales
        const productosVendidos = {}

        pedidos.forEach((pedido) => {
            pedido.pedidoDetalle.forEach((detalle) => {
                const idProducto = detalle.idProducto
                const nombreProducto = detalle.producto.nombreProducto
                const descripcion = detalle.producto.descripcion
                const subtotal = detalle.subtotal

                if (!productosVendidos[idProducto]) {
                    productosVendidos[idProducto] = {
                        NOMBRE_PRODUCTO: nombreProducto,
                        DESCRIPCION: descripcion || "Sin descripción",
                        TOTAL_VENDIDO: 0,
                        CANTIDAD_VENDIDA: 0,
                    }
                }

                productosVendidos[idProducto].TOTAL_VENDIDO += subtotal
                productosVendidos[idProducto].CANTIDAD_VENDIDA += detalle.cantidad
            })
        })

        // Convertir a array y ordenar por total vendido (descendente)
        const resultado = Object.values(productosVendidos).sort((a, b) => b.TOTAL_VENDIDO - a.TOTAL_VENDIDO)

        // Calcular el total general
        const totalGeneral = resultado.reduce((sum, item) => sum + item.TOTAL_VENDIDO, 0)

        // Calcular porcentaje de cada producto
        resultado.forEach((item) => {
            item.PORCENTAJE = ((item.TOTAL_VENDIDO / totalGeneral) * 100).toFixed(2)
        })

        console.log(`Productos agrupados: ${resultado.length}`)
        console.log("Primeros 3 productos:", resultado.slice(0, 3))

        return NextResponse.json({
            success: true,
            data: resultado,
            totalGeneral,
        })
    } catch (error) {
        console.error("Error en reporte de productos más vendidos:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 },
        )
    }
}

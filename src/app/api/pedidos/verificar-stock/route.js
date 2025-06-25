import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function POST(request) {
  try {
    const { idPedido } = await request.json()

    if (!idPedido) {
      return NextResponse.json({ error: "Se requiere el ID del pedido" }, { status: 400 })
    }

    // Convertir idPedido a entero
    const idPedidoInt = Number.parseInt(idPedido)

    if (isNaN(idPedidoInt)) {
      return NextResponse.json({ error: "ID de pedido inválido" }, { status: 400 })
    }

    // Obtener detalles del pedido
    const pedido = await prisma.pedidoCliente.findUnique({
      where: { idPedido: idPedidoInt },
      include: {
        pedidoDetalle: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    // Verificar stock para cada producto
    const resultadosVerificacion = []
    let stockSuficiente = true
    const materialesFaltantes = []

    for (const detalle of pedido.pedidoDetalle) {
      // Buscar fórmulas para el producto
      const formulas = await prisma.formula.findMany({
        where: { idProducto: detalle.idProducto },
        include: {
          FormulaDetalle: {
            include: {
              materiaPrima: true,
            },
          },
        },
      })

      if (formulas.length === 0) {
        resultadosVerificacion.push({
          producto: detalle.producto.nombreProducto,
          cantidad: detalle.cantidad,
          error: "No hay fórmula definida para este producto",
        })
        stockSuficiente = false
        continue
      }

      // Usar la primera fórmula
      const formula = formulas[0]

      // Usar el peso por unidad del producto desde la base de datos
      const pesoPorUnidad = detalle.producto.pesoUnidad

      console.log(`=== VERIFICACIÓN STOCK API ===`)
      console.log(`Producto: ${detalle.producto.nombreProducto}`)
      console.log(`Cantidad pedida: ${detalle.cantidad} unidades`)
      console.log(`Peso por unidad (DB): ${pesoPorUnidad}g`)

      // Calcular la cantidad de materia prima proporcional (NO redondear a lotes completos)
      const cantidadPorLote = formula.rendimiento

      // Verificar stock de cada materia prima
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadMateriaPrimaPorLote = detalleFormula.cantidad
        // Cálculo proporcional CORREGIDO: solo por unidades, no por peso
        const cantidadTotalMateriaPrima = (detalle.cantidad / cantidadPorLote) * cantidadMateriaPrimaPorLote;
        // Redondear a gramos enteros
        const cantidadTotalMateriaPrimaRedondeada = Math.ceil(cantidadTotalMateriaPrima);
        const faltante = cantidadTotalMateriaPrimaRedondeada - detalleFormula.materiaPrima.stockActual;

        const materiaPrima = detalleFormula.materiaPrima

        if (detalleFormula.materiaPrima.stockActual < cantidadTotalMateriaPrima) {
          stockSuficiente = false
          materialesFaltantes.push({
            idMateriaPrima: materiaPrima.idMateriaPrima,
            materiaPrima: materiaPrima.nombreMateriaPrima,
            stockActual: Math.floor(materiaPrima.stockActual),
            cantidadNecesaria: cantidadTotalMateriaPrimaRedondeada,
            faltante: Math.max(faltante, 0),
            unidadMedida: "g",
            detalleCalculo: {
              producto: detalle.producto.nombreProducto,
              cantidadPedida: detalle.cantidad,
              pesoPorUnidad: pesoPorUnidad,
              gramosNecesarios: detalle.cantidad * pesoPorUnidad,
              cantidadPorLote: cantidadMateriaPrimaPorLote,
            },
          })
        }
      }

      resultadosVerificacion.push({
        producto: detalle.producto.nombreProducto,
        cantidad: detalle.cantidad,
        pesoPorUnidad: pesoPorUnidad,
        gramosNecesarios: detalle.cantidad * pesoPorUnidad,
        cantidadPorLote,
      })
    }

    return NextResponse.json({
      idPedido: idPedidoInt,
      stockSuficiente,
      resultadosVerificacion,
      materialesFaltantes,
    })
  } catch (error) {
    console.error("Error al verificar stock:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

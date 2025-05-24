import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

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

      // Calcular gramos totales necesarios
      const gramosNecesarios = detalle.cantidad * pesoPorUnidad

      // Calcular cuántos lotes de producción se necesitan
      const cantidadPorLote = formula.rendimiento
      const lotesNecesarios = Math.ceil(gramosNecesarios / cantidadPorLote)

      console.log(`=== VERIFICACIÓN STOCK API ===`)
      console.log(`Producto: ${detalle.producto.nombreProducto}`)
      console.log(`Cantidad pedida: ${detalle.cantidad} unidades`)
      console.log(`Peso por unidad (DB): ${pesoPorUnidad}g`)
      console.log(`Gramos totales necesarios: ${gramosNecesarios}g`)

      // Verificar stock de cada materia prima
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadMateriaPrimaPorLote = detalleFormula.cantidad
        const cantidadTotalMateriaPrima = cantidadMateriaPrimaPorLote * lotesNecesarios
        const materiaPrima = detalleFormula.materiaPrima

        if (materiaPrima.stockActual < cantidadTotalMateriaPrima) {
          stockSuficiente = false
          materialesFaltantes.push({
            idMateriaPrima: materiaPrima.idMateriaPrima,
            materiaPrima: materiaPrima.nombreMateriaPrima,
            stockActual: materiaPrima.stockActual,
            cantidadNecesaria: cantidadTotalMateriaPrima,
            faltante: cantidadTotalMateriaPrima - materiaPrima.stockActual,
            unidadMedida: "g",
            detalleCalculo: {
              producto: detalle.producto.nombreProducto,
              cantidadPedida: detalle.cantidad,
              pesoPorUnidad: pesoPorUnidad,
              gramosNecesarios: gramosNecesarios,
              lotesNecesarios: lotesNecesarios,
              cantidadPorLote: cantidadMateriaPrimaPorLote,
            },
          })
        }
      }

      resultadosVerificacion.push({
        producto: detalle.producto.nombreProducto,
        cantidad: detalle.cantidad,
        pesoPorUnidad: pesoPorUnidad,
        gramosNecesarios: gramosNecesarios,
        lotesNecesarios,
        cantidadPorLote,
      })
    }

    // Registrar auditoría de verificación de stock
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarAuditoria({
      entidad: "PedidoCliente",
      idRegistro: idPedidoInt,
      accion: "VERIFICACION_STOCK",
      valorAnterior: null,
      valorNuevo: {
        stockSuficiente,
        materialesFaltantes: materialesFaltantes.length,
        productosVerificados: resultadosVerificacion.length,
        descripcion: `Verificación de stock para pedido #${idPedidoInt} - ${stockSuficiente ? "Stock suficiente" : "Stock insuficiente"}`,
      },
      idUsuario: 1, // Por ahora usar un ID fijo, después se puede obtener del token de sesión
      request: request,
    })

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

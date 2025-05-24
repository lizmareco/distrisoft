import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function POST(request) {
  try {
    const { idPedido, operadorEncargado, observaciones } = await request.json()

    if (!idPedido || !operadorEncargado) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Convertir valores a los tipos correctos
    const idPedidoInt = Number.parseInt(idPedido)
    const operadorEncargadoInt = Number.parseInt(operadorEncargado)

    if (isNaN(idPedidoInt) || isNaN(operadorEncargadoInt)) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
    }

    // Verificar que el pedido existe y está en estado "Pendiente"
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

    if (pedido.idEstadoPedido !== 1) {
      return NextResponse.json({ error: "El pedido no está en estado pendiente" }, { status: 400 })
    }

    // Verificar que no existe ya una orden de producción para este pedido
    const ordenExistente = await prisma.ordenProduccion.findFirst({
      where: {
        idPedido: idPedidoInt,
        deletedAt: null,
      },
    })

    if (ordenExistente) {
      return NextResponse.json({ error: "Ya existe una orden de producción para este pedido" }, { status: 400 })
    }

    // Verificar stock una vez más antes de crear la orden
    const stockVerificado = await verificarYDescontarStock(idPedidoInt)
    if (!stockVerificado.success) {
      return NextResponse.json({ error: stockVerificado.error }, { status: 400 })
    }

    // Crear la orden de producción en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Crear la orden de producción con fecha de inicio automática
      const nuevaOrden = await prisma.ordenProduccion.create({
        data: {
          idPedido: idPedidoInt,
          fechaInicioProd: new Date(), // Fecha actual automática
          fechaFinProd: new Date("1900-01-01"), // Fecha temporal, se actualizará al finalizar
          operadorEncargado: operadorEncargadoInt,
          idEstadoOrdenProd: 1, // Estado "EN PROCESO"
        },
      })

      // 2. Actualizar el estado del pedido a "En proceso" (ID: 2)
      await prisma.pedidoCliente.update({
        where: { idPedido: idPedidoInt },
        data: { idEstadoPedido: 2 },
      })

      // 3. Descontar stock de materias primas y registrar movimientos
      await descontarStockMateriasPrimas(prisma, idPedidoInt, operadorEncargadoInt)

      return nuevaOrden
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "OrdenProduccion",
      resultado.idOrdenProduccion,
      {
        idPedido: idPedidoInt,
        fechaInicioProd: new Date().toISOString(),
        operadorEncargado: operadorEncargadoInt,
        observaciones: observaciones || null,
        descripcion: `Orden de producción creada para pedido #${idPedidoInt}`,
      },
      operadorEncargadoInt,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      ordenProduccion: resultado,
      message: "Orden de producción creada exitosamente",
    })
  } catch (error) {
    console.error("Error al crear orden de producción:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Función para verificar y descontar stock
async function verificarYDescontarStock(idPedido) {
  try {
    // Obtener detalles del pedido
    const pedido = await prisma.pedidoCliente.findUnique({
      where: { idPedido },
      include: {
        pedidoDetalle: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!pedido) {
      return { success: false, error: "Pedido no encontrado" }
    }

    // Verificar stock para cada producto
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
        return { success: false, error: `No hay fórmula definida para ${detalle.producto.nombreProducto}` }
      }

      // Usar la primera fórmula
      const formula = formulas[0]

      // Usar el peso por unidad del producto desde la base de datos
      const pesoPorUnidad = detalle.producto.pesoUnidad

      // Calcular gramos totales necesarios
      const gramosNecesarios = detalle.cantidad * pesoPorUnidad

      // Calcular cuántos lotes de producción se necesitan basado en el rendimiento de la fórmula
      const cantidadPorLote = formula.rendimiento
      const lotesNecesarios = Math.ceil(gramosNecesarios / cantidadPorLote)

      console.log(`=== VERIFICACIÓN DE STOCK ===`)
      console.log(`Producto: ${detalle.producto.nombreProducto}`)
      console.log(`Cantidad pedida: ${detalle.cantidad} unidades`)
      console.log(`Peso por unidad (DB): ${pesoPorUnidad}g`)
      console.log(`Gramos totales necesarios: ${gramosNecesarios}g`)
      console.log(`Rendimiento por lote: ${cantidadPorLote}g`)
      console.log(`Lotes necesarios: ${lotesNecesarios}`)

      // Verificar stock de cada materia prima
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadMateriaPrimaPorLote = detalleFormula.cantidad
        const cantidadTotalMateriaPrima = cantidadMateriaPrimaPorLote * lotesNecesarios
        const materiaPrima = detalleFormula.materiaPrima

        console.log(`--- Materia Prima ---`)
        console.log(`Materia prima: ${materiaPrima.nombreMateriaPrima}`)
        console.log(`Cantidad por lote: ${cantidadMateriaPrimaPorLote}g`)
        console.log(`Cantidad total necesaria: ${cantidadTotalMateriaPrima}g`)
        console.log(`Stock actual: ${materiaPrima.stockActual}g`)

        if (materiaPrima.stockActual < cantidadTotalMateriaPrima) {
          const stockKg = (materiaPrima.stockActual / 1000).toFixed(3)
          const necesarioKg = (cantidadTotalMateriaPrima / 1000).toFixed(3)

          return {
            success: false,
            error: `Stock insuficiente de ${materiaPrima.nombreMateriaPrima}. Disponible: ${materiaPrima.stockActual}g (${stockKg}kg), Necesario: ${cantidadTotalMateriaPrima}g (${necesarioKg}kg)`,
          }
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error en verificarYDescontarStock:", error)
    return { success: false, error: error.message }
  }
}

// Función para descontar stock de materias primas
async function descontarStockMateriasPrimas(prisma, idPedido, idUsuario) {
  // Obtener detalles del pedido
  const pedido = await prisma.pedidoCliente.findUnique({
    where: { idPedido },
    include: {
      pedidoDetalle: {
        include: {
          producto: true,
        },
      },
    },
  })

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

    if (formulas.length > 0) {
      const formula = formulas[0]

      // Usar el peso por unidad del producto desde la base de datos
      const pesoPorUnidad = detalle.producto.pesoUnidad

      // Calcular gramos totales necesarios
      const gramosNecesarios = detalle.cantidad * pesoPorUnidad

      // Calcular cuántos lotes de producción se necesitan
      const cantidadPorLote = formula.rendimiento
      const lotesNecesarios = Math.ceil(gramosNecesarios / cantidadPorLote)

      console.log(`=== DESCUENTO DE STOCK ===`)
      console.log(`Producto: ${detalle.producto.nombreProducto}`)
      console.log(`Cantidad pedida: ${detalle.cantidad} unidades`)
      console.log(`Peso por unidad (DB): ${pesoPorUnidad}g`)
      console.log(`Gramos totales necesarios: ${gramosNecesarios}g`)
      console.log(`Lotes necesarios: ${lotesNecesarios}`)

      // Descontar stock de cada materia prima
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadMateriaPrimaPorLote = detalleFormula.cantidad
        const cantidadTotalMateriaPrima = cantidadMateriaPrimaPorLote * lotesNecesarios

        console.log(`--- Descuento ---`)
        console.log(`Materia prima: ${detalleFormula.materiaPrima.nombreMateriaPrima}`)
        console.log(`Descontando: ${cantidadTotalMateriaPrima}g`)

        // Actualizar stock de materia prima (todo en gramos)
        await prisma.materiaPrima.update({
          where: { idMateriaPrima: detalleFormula.idMateriaPrima },
          data: {
            stockActual: {
              decrement: cantidadTotalMateriaPrima,
            },
            updatedAt: new Date(),
          },
        })

        // Registrar movimiento de inventario (cantidad en gramos, pero con observación en kg)
        const cantidadKg = (cantidadTotalMateriaPrima / 1000).toFixed(3)
        await prisma.inventario.create({
          data: {
            idMateriaPrima: detalleFormula.idMateriaPrima,
            cantidad: cantidadTotalMateriaPrima, // Cantidad en gramos
            unidadMedida: "g", // Unidad en gramos
            fechaMovimiento: new Date(),
            tipoMovimiento: "SALIDA", // String directo
            motivo: `Salida para orden de producción - Pedido #${idPedido}`,
            observacion: `Salida para producción de ${detalle.producto.nombreProducto}. Pedido: ${detalle.cantidad} unidades x ${pesoPorUnidad}g = ${gramosNecesarios}g. Materia prima utilizada: ${cantidadTotalMateriaPrima}g (${cantidadKg}kg)`,
          },
        })
      }
    }
  }
}

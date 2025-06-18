import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import cookie from "cookie" 

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header (para Next.js App Router y API routes modernas)
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  // Fallback: Authorization header (Bearer)
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) {
    console.warn("NO TOKEN FOUND, defaulting to 1")
    return 1
  }

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

//CREAR ORDEN DE PRODUCCION
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

// Buscar orden CANCELADA para reactivarla
const ordenCancelada = await prisma.ordenProduccion.findFirst({
  where: {
    idPedido: idPedidoInt,
    idEstadoOrdenProd: 3, // CANCELADO
    deletedAt: null,
  },
})

if (ordenCancelada) {
  // Verificar stock antes de reactivar
  const stockVerificado = await verificarYDescontarStock(idPedidoInt)
  if (!stockVerificado.success) {
    return NextResponse.json({ error: stockVerificado.error }, { status: 400 })
  }

  const auditoriaService = new AuditoriaService()
  const idUsuario = await getUserIdFromRequest(request)

  const ordenReactivada = await prisma.$transaction(async (tx) => {
    const reactivada = await tx.ordenProduccion.update({
      where: { idOrdenProduccion: ordenCancelada.idOrdenProduccion },
      data: {
        idEstadoOrdenProd: 1, // EN PROCESO
        fechaInicioProd: new Date(),
        updatedAt: new Date(),
      },
    })

    await tx.pedidoCliente.update({
      where: { idPedido: idPedidoInt },
      data: { idEstadoPedido: 2 },
    })

    return reactivada
  })

  await descontarStockMateriasPrimas(prisma, idPedidoInt, idUsuario, auditoriaService, request)

  // Auditoría
  await auditoriaService.registrarAuditoria({
    entidad: "OrdenProduccion",
    idRegistro: ordenCancelada.idOrdenProduccion,
    accion: "REACTIVAR_ORDEN_PRODUCCION",
    valorAnterior: { estado: "CANCELADO" },
    valorNuevo: { estado: "EN PROCESO" },
    idUsuario,
    direccionIP: auditoriaService.obtenerDireccionIP(request),
    navegador: auditoriaService.obtenerInfoNavegador(request),
  })

  return NextResponse.json({
    success: true,
    ordenProduccion: ordenReactivada,
    message: "Orden de producción reactivada exitosamente",
  })
}


// Verificar que NO exista otra orden (EN PROCESO o FINALIZADA)
const ordenActiva = await prisma.ordenProduccion.findFirst({
  where: {
    idPedido: idPedidoInt,
    deletedAt: null,
    NOT: {
      idEstadoOrdenProd: 3, // Excluir CANCELADA
    },
  },
})

if (ordenActiva) {
  return NextResponse.json({ error: "Ya existe una orden de producción activa o finalizada para este pedido" }, { status: 400 })
}


    // Verificar stock una vez más antes de crear la orden
    const stockVerificado = await verificarYDescontarStock(idPedidoInt)
    if (!stockVerificado.success) {
      return NextResponse.json({ error: stockVerificado.error }, { status: 400 })
    }

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)
    // Crear la orden de producción en una transacción
    const resultado = await prisma.$transaction(async (prismaTx) => {
      const nuevaOrden = await prisma.ordenProduccion.create({
        data: {
          idPedido: idPedidoInt,
          fechaInicioProd: new Date(),
          fechaFinProd: new Date("1900-01-01"),
          operadorEncargado: operadorEncargadoInt,
          idEstadoOrdenProd: 1,
        },
      })
    
      await prismaTx.pedidoCliente.update({
        where: { idPedido: idPedidoInt },
        data: { idEstadoPedido: 2 },
      })
    
      return nuevaOrden
    })

    await descontarStockMateriasPrimas(prisma, idPedidoInt, idUsuario, auditoriaService, request)

    // Registrar auditoría

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
      idUsuario,
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
async function descontarStockMateriasPrimas(tx, idPedido, idUsuario, auditoriaService, request) {


  const pedido = await tx.pedidoCliente.findUnique({
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
    const formulas = await tx.formula.findMany({
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
      const pesoPorUnidad = detalle.producto.pesoUnidad
      const gramosNecesarios = detalle.cantidad * pesoPorUnidad
      const cantidadPorLote = formula.rendimiento
      const lotesNecesarios = Math.ceil(gramosNecesarios / cantidadPorLote)

      console.log(`=== DESCUENTO DE STOCK ===`)
      console.log(`Producto: ${detalle.producto.nombreProducto}`)
      console.log(`Cantidad pedida: ${detalle.cantidad} unidades`)
      console.log(`Peso por unidad (DB): ${pesoPorUnidad}g`)
      console.log(`Gramos totales necesarios: ${gramosNecesarios}g`)
      console.log(`Lotes necesarios: ${lotesNecesarios}`)

      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadMateriaPrimaPorLote = detalleFormula.cantidad
        const cantidadTotalMateriaPrima = cantidadMateriaPrimaPorLote * lotesNecesarios

        const materiaPrima = await tx.materiaPrima.findUnique({
          where: { idMateriaPrima: detalleFormula.idMateriaPrima },
        })

        if (!materiaPrima) {
          console.warn(`Materia prima ID ${detalleFormula.idMateriaPrima} no encontrada. Saltando.`)
          continue
        }

        const stockAntes = Number.parseFloat(materiaPrima.stockActual ?? 0)
        const stockDespues = stockAntes - cantidadTotalMateriaPrima

        console.log(`--- Descuento ---`)
        console.log(`Materia prima: ${materiaPrima.nombreMateriaPrima}`)
        console.log(`Descontando: ${cantidadTotalMateriaPrima}g`)
        console.log(`Stock: ${stockAntes}g -> ${stockDespues}g`)

        // Actualizar stock
        await tx.materiaPrima.update({
          where: { idMateriaPrima: detalleFormula.idMateriaPrima },
          data: {
            stockActual: stockDespues,
            updatedAt: new Date(),
          },
        })

        // Crear movimiento de inventario con stockAntes y stockDespues
        const cantidadKg = (cantidadTotalMateriaPrima / 1000).toFixed(3)
        await tx.inventario.create({
          data: {
            idMateriaPrima: detalleFormula.idMateriaPrima,
            cantidad: cantidadTotalMateriaPrima,
            unidadMedida: "g",
            fechaMovimiento: new Date(),
            tipoMovimiento: "SALIDA",
            motivo: `Salida para orden de producción - Pedido #${idPedido}`,
            observacion: `Salida para producción de ${detalle.producto.nombreProducto}. Pedido: ${detalle.cantidad} unidades x ${pesoPorUnidad}g = ${gramosNecesarios}g. Materia prima utilizada: ${cantidadTotalMateriaPrima}g (${cantidadKg}kg)`,
            stockAntes,
            stockDespues,
          },
        })

        // Auditoría de salida de stock
        await auditoriaService.registrarAuditoria({
          entidad: "MateriaPrima",
          idRegistro: detalleFormula.idMateriaPrima,
          accion: "ACTUALIZAR_STOCK_MATERIA_PRIMA",
          valorAnterior: { stockActual: stockAntes },
          valorNuevo: { stockActual: stockDespues },
          idUsuario,
          direccionIP: auditoriaService.obtenerDireccionIP(request),
          navegador: auditoriaService.obtenerInfoNavegador(request),
        })
      }
    }
  }
}

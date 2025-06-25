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

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const { idEstadoOrdenProd } = await request.json()

    if (!idEstadoOrdenProd) {
      return NextResponse.json({ error: "Se requiere el ID del estado" }, { status: 400 })
    }

    const idOrdenInt = Number.parseInt(id)
    const idEstadoInt = Number.parseInt(idEstadoOrdenProd)

    // Obtener la orden actual con todos los datos necesarios
    const ordenActual = await prisma.ordenProduccion.findUnique({
      where: { idOrdenProduccion: idOrdenInt },
      include: {
        pedidoCliente: {
          include: {
            pedidoDetalle: {
              include: {
                producto: {
                  include: {
                    unidadMedida: true,
                  },
                },
              },
            },
          },
        },
        usuario: true,
      },
    })

    if (!ordenActual) {
      return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: 404 })
    }

    // Verificar que no esté ya finalizada
    if (ordenActual.idEstadoOrdenProd === 2) {
      return NextResponse.json(
        {
          error: "Esta orden ya está finalizada y no se puede modificar",
        },
        { status: 400 },
      )
    }

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)
    // Usar transacción para asegurar consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      const detallesFinales = []
      const fechaActual = new Date()
      const datosActualizacion = {
        idEstadoOrdenProd: idEstadoInt,
        updatedAt: fechaActual,
      }

      if (idEstadoInt === 2) {
        await tx.pedidoCliente.update({
          where: { idPedido: ordenActual.idPedido },
          data: {
            idEstadoPedido: 3,
            updatedAt: fechaActual,
          },
        })

        for (const detalle of ordenActual.pedidoCliente.pedidoDetalle) {
          const producto = await tx.producto.findUnique({
            where: { idProducto: detalle.idProducto },
          })

          const stockAntes = Number(producto?.stockActual ?? 0)
          const stockDespues = stockAntes + detalle.cantidad

          await tx.producto.update({
            where: { idProducto: detalle.idProducto },
            data: {
              stockActual: stockDespues,
              updatedAt: fechaActual,
            },
          })

          // Crear movimiento de inventario de producto dentro de la transacción
          await tx.inventarioProducto.create({
            data: {
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad,
              unidadMedida: detalle.producto.unidadMedida?.nombre || "unidades",
              fechaMovimiento: fechaActual,
              tipoMovimiento: "ENTRADA",
              motivo: "Entrada por producción finalizada",
              observacion: `Entrada por finalización de producción - Orden #${idOrdenInt}`,
              stockAntes: stockAntes,
              stockDespues: stockDespues,
            },
          })

          // Auditoría dentro de la transacción
          await auditoriaService.registrarAuditoria({
            entidad: "Producto",
            idRegistro: detalle.idProducto,
            accion: "ACTUALIZAR_STOCK_PRODUCTO",
            valorAnterior: { stockActual: stockAntes },
            valorNuevo: { stockActual: stockDespues },
            idUsuario,
            direccionIP: auditoriaService.obtenerDireccionIP(request),
            navegador: auditoriaService.obtenerInfoNavegador(request),
            tx,
          })

          detallesFinales.push({
            tipo: "PRODUCTO",
            idProducto: detalle.idProducto,
            cantidad: detalle.cantidad,
            unidadMedida: detalle.producto.unidadMedida?.nombre || "unidades",
            stockAntes,
            stockDespues,
          })
        }
      } else if (idEstadoInt === 3) {
        for (const detalle of ordenActual.pedidoCliente.pedidoDetalle) {
          const producto = detalle.producto
          const formula = await tx.formula.findFirst({
            where: { idProducto: producto.idProducto, deletedAt: null },
            orderBy: { idFormula: "desc" },
          })

          if (!formula) throw new Error(`No se encontró fórmula para el producto ${producto.nombreProducto}`)

          const detallesFormula = await tx.formulaDetalle.findMany({
            where: { idFormula: formula.idFormula, deletedAt: null },
          })

          const pesoPorUnidad = producto.pesoUnidad
          const gramosNecesarios = detalle.cantidad * pesoPorUnidad
          const cantidadPorLote = formula.rendimiento
          // const lotesNecesarios = Math.ceil(gramosNecesarios / cantidadPorLote)

          console.log(`=== DEVOLUCIÓN DE STOCK ===`)
          console.log(`Producto: ${producto.nombreProducto}`)
          console.log(`Cantidad pedida: ${detalle.cantidad} unidades`)
          console.log(`Peso por unidad: ${pesoPorUnidad}g`)
          console.log(`Gramos totales necesarios: ${gramosNecesarios}g`)
          console.log(`Rendimiento por lote: ${cantidadPorLote}g`)
          // console.log(`Lotes necesarios: ${lotesNecesarios}`)

          for (const item of detallesFormula) {
            const cantidadMateriaPrimaPorLote = item.cantidad
            // Fórmula proporcional para devolución:
            const cantidadTotal = (detalle.cantidad / formula.rendimiento) * cantidadMateriaPrimaPorLote
            const materia = await tx.materiaPrima.findUnique({ where: { idMateriaPrima: item.idMateriaPrima } })
            const stockAntes = Number(materia?.stockActual ?? 0)
            const stockDespues = stockAntes + cantidadTotal

            console.log(`--- Devolución ---`)
            console.log(`Materia prima: ${materia?.nombreMateriaPrima}`)
            console.log(`Cantidad por lote: ${cantidadMateriaPrimaPorLote}g`)
            console.log(`Devolviendo: ${cantidadTotal}g`)
            console.log(`Stock: ${stockAntes}g -> ${stockDespues}g`)

            await tx.materiaPrima.update({
              where: { idMateriaPrima: item.idMateriaPrima },
              data: { stockActual: stockDespues, updatedAt: fechaActual },
            })

            // Crear movimiento de inventario de materia prima dentro de la transacción
            await tx.inventario.create({
              data: {
                idMateriaPrima: item.idMateriaPrima,
                cantidad: cantidadTotal,
                unidadMedida: item.unidadMedida,
                fechaMovimiento: fechaActual,
                tipoMovimiento: "ENTRADA",
                motivo: "Cancelación de orden de producción",
                observacion: `Orden cancelada #${idOrdenInt} - Producto: ${producto.nombreProducto}`,
                stockAntes: stockAntes,
                stockDespues: stockDespues,
              },
            })

            // Auditoría dentro de la transacción
            await auditoriaService.registrarAuditoria({
              entidad: "MateriaPrima",
              idRegistro: item.idMateriaPrima,
              accion: "DEVOLVER_STOCK_MATERIA_PRIMA",
              valorAnterior: { stockActual: stockAntes },
              valorNuevo: { stockActual: stockDespues },
              idUsuario,
              direccionIP: auditoriaService.obtenerDireccionIP(request),
              navegador: auditoriaService.obtenerInfoNavegador(request),
              tx,
            })

            detallesFinales.push({
              tipo: "MATERIA_PRIMA",
              idMateriaPrima: item.idMateriaPrima,
              cantidad: cantidadTotal,
              unidadMedida: item.unidadMedida,
              productoNombre: producto.nombreProducto,
              stockAntes,
              stockDespues,
            })
          }
        }
      }

      const ordenActualizada = await tx.ordenProduccion.update({
        where: { idOrdenProduccion: idOrdenInt },
        data: datosActualizacion,
        include: {
          pedidoCliente: true,
          usuario: { include: { persona: true } },
        },
      })

      return { ordenActualizada, fechaActual, movimientos: detallesFinales }
    }, {
      maxWait: 15000, // 15 segundos para esperar a que inicie la tx
      timeout: 30000, // 30 segundos para ejecutar la tx
    })
    
    await auditoriaService.registrarActualizacion(
      "OrdenProduccion",
      idOrdenInt,
      {
        idEstadoOrdenProd: ordenActual.idEstadoOrdenProd,
        fechaFinProd: ordenActual.fechaFinProd,
      },
      {
        idEstadoOrdenProd: idEstadoInt,
        pedidoActualizado: idEstadoInt === 2 ? "Estado cambiado a LISTO PARA ENTREGA" : null,
      },
      idUsuario,
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    return NextResponse.json({
      success: true,
      ordenProduccion: resultado.ordenActualizada,
      message:
        idEstadoInt === 2
          ? "Orden finalizada exitosamente. El pedido está listo para entrega y el stock ha sido actualizado."
          : "Orden cancelada exitosamente. Materias primas devueltas.",
    })
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

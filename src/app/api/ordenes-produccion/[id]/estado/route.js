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
        const lotes = ordenActual.cantidadLotes || 1

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

          for (const item of detallesFormula) {
            const cantidadTotal = item.cantidad * detalle.cantidad * lotes
            const materia = await tx.materiaPrima.findUnique({ where: { idMateriaPrima: item.idMateriaPrima } })
            const stockAntes = Number(materia?.stockActual ?? 0)
            const stockDespues = stockAntes + cantidadTotal

            await tx.materiaPrima.update({
              where: { idMateriaPrima: item.idMateriaPrima },
              data: { stockActual: stockDespues, updatedAt: fechaActual },
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
    })
    
    
    for (const detalle of resultado.movimientos) {
      if (detalle.tipo === "PRODUCTO") {
        await prisma.inventarioProducto.create({
          data: {
            idProducto: detalle.idProducto,
            cantidad: detalle.cantidad,
            unidadMedida: detalle.unidadMedida,
            fechaMovimiento: resultado.fechaActual,
            tipoMovimiento: "ENTRADA",
            motivo: "Entrada por producción finalizada",
            observacion: `Entrada por finalización de producción - Orden #${idOrdenInt}`,
            stockAntes: detalle.stockAntes,
            stockDespues: detalle.stockDespues,
          },
        })

        await auditoriaService.registrarAuditoria({
          entidad: "Producto",
          idRegistro: detalle.idProducto,
          accion: "ACTUALIZAR_STOCK_PRODUCTO",
          valorAnterior: { stockActual: detalle.stockAntes },
          valorNuevo: { stockActual: detalle.stockDespues },
          idUsuario,
          direccionIP: auditoriaService.obtenerDireccionIP(request),
          navegador: auditoriaService.obtenerInfoNavegador(request),
        })
      } else if (detalle.tipo === "MATERIA_PRIMA") {
        await prisma.inventario.create({
          data: {
            idMateriaPrima: detalle.idMateriaPrima,
            cantidad: detalle.cantidad,
            unidadMedida: detalle.unidadMedida,
            fechaMovimiento: resultado.fechaActual,
            tipoMovimiento: "ENTRADA",
            motivo: "Cancelación de orden de producción",
            observacion: `Orden cancelada #${idOrdenInt} - Producto: ${detalle.productoNombre}`,
            stockAntes: detalle.stockAntes,
            stockDespues: detalle.stockDespues,
          },
        })

        await auditoriaService.registrarAuditoria({
          entidad: "MateriaPrima",
          idRegistro: detalle.idMateriaPrima,
          accion: "DEVOLVER_STOCK_MATERIA_PRIMA",
          valorAnterior: { stockActual: detalle.stockAntes },
          valorNuevo: { stockActual: detalle.stockDespues },
          idUsuario,
          direccionIP: auditoriaService.obtenerDireccionIP(request),
          navegador: auditoriaService.obtenerInfoNavegador(request),
        })
      }
    }

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

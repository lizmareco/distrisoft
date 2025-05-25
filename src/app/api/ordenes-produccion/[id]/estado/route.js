import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

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

    // Usar transacción para asegurar consistencia
    const resultado = await prisma.$transaction(async (tx) => {
      const fechaActual = new Date()

      // Preparar datos de actualización de la orden
      const datosActualizacion = {
        idEstadoOrdenProd: idEstadoInt,
        updatedAt: fechaActual,
      }

      // Si cambia a FINALIZADO (estado 2)
      if (idEstadoInt === 2) {
        console.log("=== FINALIZANDO ORDEN DE PRODUCCIÓN ===")
        console.log(`Orden ID: ${idOrdenInt}`)
        console.log(`Pedido ID: ${ordenActual.idPedido}`)

        // Establecer fecha de finalización
        datosActualizacion.fechaFinProd = fechaActual

        // 1. Actualizar estado del pedido a "LISTO PARA ENTREGA" (ID 3)
        await tx.pedidoCliente.update({
          where: { idPedido: ordenActual.idPedido },
          data: {
            idEstadoPedido: 3,
            updatedAt: fechaActual,
          },
        })
        console.log("✓ Pedido actualizado a 'LISTO PARA ENTREGA'")

        // 2. Sumar stock de productos finalizados y registrar movimientos
        for (const detalle of ordenActual.pedidoCliente.pedidoDetalle) {
          console.log(`--- Procesando producto: ${detalle.producto.nombreProducto} ---`)
          console.log(`Cantidad a agregar al stock: ${detalle.cantidad}`)

          // Actualizar stock del producto
          const productoActualizado = await tx.producto.update({
            where: { idProducto: detalle.idProducto },
            data: {
              stockActual: {
                increment: detalle.cantidad,
              },
              updatedAt: fechaActual,
            },
          })
          console.log(`✓ Stock actualizado: ${productoActualizado.stockActual}`)

          // Registrar movimiento de ENTRADA en inventario de productos
          const movimiento = await tx.inventarioProducto.create({
            data: {
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad,
              unidadMedida: detalle.producto.unidadMedida?.nombre || "unidades",
              fechaMovimiento: fechaActual,
              tipoMovimiento: "ENTRADA",
              idOrdenProduccion: idOrdenInt,
              motivo: `Entrada por producción finalizada`,
              observacion: `Entrada por finalización de producción - Pedido #${ordenActual.idPedido} - Orden #${idOrdenInt}`,
            },
          })
          console.log(`✓ Movimiento de inventario registrado: ID ${movimiento.idInventarioProducto}`)
        }
      }

      // Actualizar la orden de producción
      const ordenActualizada = await tx.ordenProduccion.update({
        where: { idOrdenProduccion: idOrdenInt },
        data: datosActualizacion,
        include: {
          pedidoCliente: true,
          usuario: {
            include: {
              persona: true,
            },
          },
        },
      })

      return ordenActualizada
    })

    // Registrar auditoría
    const auditoriaService = new AuditoriaService()
    const valorAnterior = {
      idEstadoOrdenProd: ordenActual.idEstadoOrdenProd,
      fechaFinProd: ordenActual.fechaFinProd,
    }
    const valorNuevo = {
      idEstadoOrdenProd: idEstadoInt,
      fechaFinProd: resultado.fechaFinProd,
      pedidoActualizado: idEstadoInt === 2 ? "Estado cambiado a LISTO PARA ENTREGA" : null,
    }

    await auditoriaService.registrarActualizacion(
      "OrdenProduccion",
      idOrdenInt,
      valorAnterior,
      valorNuevo,
      1, // TODO: Obtener usuario actual
      auditoriaService.obtenerDireccionIP(request),
      auditoriaService.obtenerInfoNavegador(request),
    )

    console.log("=== ORDEN FINALIZADA EXITOSAMENTE ===")

    return NextResponse.json({
      success: true,
      ordenProduccion: resultado,
      message:
        idEstadoInt === 2
          ? "Orden finalizada exitosamente. El pedido está listo para entrega y el stock ha sido actualizado."
          : "Estado actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error al actualizar estado:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const authController = new AuthController()
const auditoriaService = new AuditoriaService()

// PUT - Actualizar el estado de una orden de producción
export async function PUT(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json(
        { error: "ID de orden de producción no proporcionado" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    console.log(`API: Actualizando estado de orden de producción ID: ${id}`)

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = token ? await authController.getUserFromToken(token) : { idUsuario: 1, usuario: "desarrollo" }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    if (!data.idEstadoOrdenProd) {
      return NextResponse.json(
        { error: "Datos incompletos", details: "Se requiere idEstadoOrdenProd" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que la orden de producción existe
    const ordenExistente = await prisma.ordenProduccion.findUnique({
      where: { idOrdenProduccion: Number.parseInt(id), deletedAt: null },
      include: {
        estadoOrdenProd: true,
        pedidoCliente: {
          include: {
            pedidoDetalle: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
    })

    if (!ordenExistente) {
      return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si hay un cambio real de estado
    if (ordenExistente.idEstadoOrdenProd === data.idEstadoOrdenProd) {
      return NextResponse.json(
        { message: "La orden ya tiene ese estado", orden: ordenExistente },
        { status: HTTP_STATUS_CODES.ok },
      )
    }

    // Verificar si el cambio es a COMPLETADA o PARCIALMENTE COMPLETADA
    const cambioACompletada = data.idEstadoOrdenProd === 3 // Asumiendo que 3 es el ID para COMPLETADA
    const cambioAParcialmenteCompletada = data.idEstadoOrdenProd === 4 // Asumiendo que 4 es el ID para PARCIALMENTE COMPLETADA

    // Actualizar la orden de producción
    const ordenActualizada = await prisma.ordenProduccion.update({
      where: { idOrdenProduccion: Number.parseInt(id) },
      data: {
        idEstadoOrdenProd: data.idEstadoOrdenProd,
        updatedAt: new Date(),
      },
      include: {
        estadoOrdenProd: true,
        pedidoCliente: {
          include: {
            pedidoDetalle: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
    })

    // Si se cambió a COMPLETADA, actualizar el inventario con todos los productos
    if (cambioACompletada) {
      console.log("API: Actualizando inventario con todos los productos completados")

      // Obtener los detalles del pedido
      const detalles = ordenExistente.pedidoCliente.pedidoDetalle || []

      // Crear registros de inventario y actualizar stock para cada producto
      for (const detalle of detalles) {
        // Crear registro en inventario de productos
        await prisma.inventarioProducto.create({
          data: {
            idProducto: detalle.idProducto,
            cantidad: detalle.cantidad,
            unidadMedida: detalle.producto.unidadMedida?.abreviatura || "Unidad",
            tipoMovimiento: "ENTRADA",
            fechaMovimiento: new Date(),
            idOrdenProduccion: Number.parseInt(id),
            motivo: `Producción completa de orden #${id}`,
            observacion: data.observacion || `Producción finalizada según pedido #${ordenExistente.idPedido}`,
          },
        })

        // Actualizar el stock del producto
        await prisma.producto.update({
          where: { idProducto: detalle.idProducto },
          data: {
            stockActual: {
              increment: detalle.cantidad,
            },
            updatedAt: new Date(),
          },
        })

        console.log(`API: Stock actualizado para producto ID ${detalle.idProducto}, +${detalle.cantidad}`)
      }
    }
    // Si se cambió a PARCIALMENTE COMPLETADA y se proporcionaron items, actualizar el inventario con esos items
    else if (cambioAParcialmenteCompletada && data.produccionItems && data.produccionItems.length > 0) {
      console.log("API: Actualizando inventario con productos parcialmente completados")

      // Crear registros de inventario y actualizar stock para cada producto producido
      for (const item of data.produccionItems) {
        // Crear registro en inventario de productos
        await prisma.inventarioProducto.create({
          data: {
            idProducto: item.idProducto,
            cantidad: item.cantidad,
            unidadMedida: item.unidadMedida || "Unidad",
            tipoMovimiento: "ENTRADA",
            fechaMovimiento: new Date(),
            idOrdenProduccion: Number.parseInt(id),
            motivo: `Producción parcial de orden #${id}`,
            observacion: data.observacion || `Producción parcial según pedido #${ordenExistente.idPedido}`,
          },
        })

        // Actualizar el stock del producto
        await prisma.producto.update({
          where: { idProducto: item.idProducto },
          data: {
            stockActual: {
              increment: item.cantidad,
            },
            updatedAt: new Date(),
          },
        })

        console.log(`API: Stock actualizado para producto ID ${item.idProducto}, +${item.cantidad}`)
      }
    }

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "OrdenProduccion",
      ordenActualizada.idOrdenProduccion,
      ordenExistente,
      ordenActualizada,
      userData.idUsuario,
      request,
    )

    console.log(`API: Orden de producción actualizada: ${ordenActualizada.idOrdenProduccion}`)
    return NextResponse.json(ordenActualizada, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al actualizar orden de producción:", error)
    return NextResponse.json(
      { message: "Error al actualizar orden de producción", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/pedidos/[id] - Obtener un pedido por ID
export async function GET(request, { params }) {
  try {
    console.log(`API: Obteniendo pedido con ID ${params.id}...`)
    const id = await params.id

    const pedido = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: Number.parseInt(id),
        deletedAt: null,
      },
      select: {
        idPedido: true,
        fechaPedido: true,
        fechaEntrega: true,
        montoTotal: true,
        observacion: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        // Seleccionar solo los campos necesarios del cliente
        cliente: {
          select: {
            idCliente: true,
            // Seleccionar solo los campos necesarios de persona
            persona: {
              select: {
                nombre: true,
                apellido: true,
                nroDocumento: true, // Usar nroDocumento en lugar de dni
              },
            },
          },
        },
        // Seleccionar solo los campos necesarios del usuario
        usuario: {
          select: {
            idUsuario: true,
            nombreUsuario: true,
            persona: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        },
        // Seleccionar solo los campos necesarios del estado de pedido
        estadoPedido: {
          select: {
            idEstadoPedido: true,
            descEstadoPedido: true, // Usar descEstadoPedido en lugar de nombre
          },
        },
        // Seleccionar los detalles del pedido
        pedidoDetalle: {
          select: {
            idPedidoDetalle: true,
            cantidad: true,
            precioUnitario: true,
            producto: {
              select: {
                idProducto: true,
                nombreProducto: true,
              },
            },
          },
        },
      },
    })

    if (!pedido) {
      console.log(`API: Pedido con ID ${id} no encontrado`)
      return NextResponse.json({ error: `Pedido con ID ${id} no encontrado` }, { status: 404 })
    }

    console.log(`API: Pedido con ID ${id} obtenido correctamente`)
    return NextResponse.json(pedido)
  } catch (error) {
    console.error(`API: Error al obtener pedido con ID ${params.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/pedidos/[id] - Actualizar un pedido
export async function PUT(request, { params }) {
  try {
    console.log(`API: Actualizando pedido con ID ${params.id}...`)
    const id = await params.id
    const datos = await request.json()
    console.log("API: Datos recibidos:", datos)

    // Validar datos
    if (!datos.pedido) {
      console.error("API: Datos de pedido incompletos")
      return NextResponse.json({ error: "Datos de pedido incompletos" }, { status: 400 })
    }

    // Verificar si el pedido existe
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: Number.parseInt(id), // Usar idPedido en lugar de idPedidoCliente
        deletedAt: null,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${id} no encontrado para actualizar`)
      return NextResponse.json({ error: `Pedido con ID ${id} no encontrado` }, { status: 404 })
    }

    // Actualizar el pedido y sus detalles en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // Actualizar el pedido sin incluir idMetodoPago
      const pedidoActualizado = await prisma.pedidoCliente.update({
        where: {
          idPedido: Number.parseInt(id), // Usar idPedido en lugar de idPedidoCliente
        },
        data: {
          fechaPedido: new Date(datos.pedido.fechaPedido),
          idCliente: datos.pedido.idCliente,
          vendedor: datos.pedido.vendedor || datos.pedido.idUsuario, // Usar idUsuario si vendedor no está disponible
          idEstadoPedido: datos.pedido.idEstadoPedido,
          observacion: datos.pedido.observacion || "",
          montoTotal: datos.pedido.montoTotal,
          // No incluir idMetodoPago
        },
      })

      // Si hay detalles nuevos, actualizar los detalles
      if (datos.detalles && datos.detalles.length > 0) {
        // Eliminar detalles existentes
        await prisma.pedidoDetalle.deleteMany({
          where: {
            idPedidoCliente: Number.parseInt(id), // Usar idPedidoCliente para la relación
          },
        })

        // Crear nuevos detalles
        const detallesPromises = datos.detalles.map((detalle) =>
          prisma.pedidoDetalle.create({
            data: {
              idPedidoCliente: Number.parseInt(id), // Usar idPedidoCliente para la relación
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
            },
          }),
        )

        const detallesCreados = await Promise.all(detallesPromises)

        return { pedido: pedidoActualizado, detalles: detallesCreados }
      }

      return { pedido: pedidoActualizado }
    })

    console.log(`API: Pedido con ID ${id} actualizado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Pedido actualizado exitosamente",
        pedido: resultado.pedido,
        detalles: resultado.detalles,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`API: Error al actualizar pedido con ID ${params.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/pedidos/[id] - Eliminar un pedido (borrado lógico)
export async function DELETE(request, { params }) {
  try {
    console.log(`API: Eliminando pedido con ID ${params.id}...`)
    const id = await params.id

    // Verificar si el pedido existe
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: Number.parseInt(id), // Usar idPedido en lugar de idPedidoCliente
        deletedAt: null,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${id} no encontrado para eliminar`)
      return NextResponse.json({ error: `Pedido con ID ${id} no encontrado` }, { status: 404 })
    }

    // Realizar borrado lógico
    await prisma.pedidoCliente.update({
      where: {
        idPedido: Number.parseInt(id), // Usar idPedido en lugar de idPedidoCliente
      },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log(`API: Pedido con ID ${id} eliminado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Pedido eliminado exitosamente",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`API: Error al eliminar pedido con ID ${params.id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/pedidos/[id] - Obtener un pedido por ID
export async function GET(request, { params }) {
  let idPedido
  try {
    // Extraer y convertir el ID de manera segura
    // En Next.js 13+ con App Router, podemos acceder a params directamente
    const resolvedParams = await params
    const paramId = resolvedParams ? String(resolvedParams.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: 400 })
    }

    console.log(`API: Obteniendo pedido con ID ${idPedido}...`)

    const pedido = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
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
            idPedido: true,
            idProducto: true,
            cantidad: true,
            subtotal: true, // Usar subtotal en lugar de precioUnitario
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
      console.log(`API: Pedido con ID ${idPedido} no encontrado`)
      return NextResponse.json({ error: `Pedido con ID ${idPedido} no encontrado` }, { status: 404 })
    }

    // Función para convertir fecha a string en formato YYYY-MM-DD
    const formatearFechaSimple = (fecha) => {
      if (!fecha) return null
      // Convertir directamente a string y tomar solo la parte de la fecha
      return fecha.toISOString().split("T")[0]
    }

    // Imprimir la fecha original para depuración
    console.log("Fecha original:", pedido.fechaPedido)

    const pedidoFormateado = {
      ...pedido,
      // Convertir fechas a strings simples
      fechaPedido: formatearFechaSimple(pedido.fechaPedido),
      fechaEntrega: formatearFechaSimple(pedido.fechaEntrega),
      // Otras fechas como ISO strings
      createdAt: pedido.createdAt ? pedido.createdAt.toISOString() : null,
      updatedAt: pedido.updatedAt ? pedido.updatedAt.toISOString() : null,
      deletedAt: pedido.deletedAt ? pedido.deletedAt.toISOString() : null,
    }

    // Imprimir fechas para depuración
    console.log(`API: Fechas del pedido ${idPedido} formateadas:`, {
      fechaPedido: pedidoFormateado.fechaPedido,
      fechaEntrega: pedidoFormateado.fechaEntrega,
    })

    console.log(`API: Pedido con ID ${idPedido} obtenido correctamente`)
    return NextResponse.json(pedidoFormateado)
  } catch (error) {
    console.error(`API: Error al obtener pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/pedidos/[id] - Actualizar un pedido
export async function PUT(request, { params }) {
  let idPedido
  try {
    // Extraer y convertir el ID de manera segura
    const resolvedParams = await params
    const paramId = resolvedParams ? String(resolvedParams.id || "0") : "0"

    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: 400 })
    }

    console.log(`API: Actualizando pedido con ID ${idPedido}...`)

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
        idPedido: idPedido,
        deletedAt: null,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado para actualizar`)
      return NextResponse.json({ error: `Pedido con ID ${idPedido} no encontrado` }, { status: 404 })
    }

    // Verificar la estructura de la tabla pedidoDetalle
    console.log("API: Verificando estructura de pedidoDetalle...")
    try {
      const detalleEjemplo = await prisma.pedidoDetalle.findFirst({
        where: {
          idPedido: idPedido,
        },
      })
      console.log("API: Ejemplo de detalle encontrado:", detalleEjemplo)
    } catch (error) {
      console.error("API: Error al verificar estructura:", error)
    }

    // Actualizar el pedido y sus detalles en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // Actualizar el pedido
      const pedidoActualizado = await prisma.pedidoCliente.update({
        where: {
          idPedido: idPedido,
        },
        data: {
          fechaPedido: new Date(datos.pedido.fechaPedido),
          fechaEntrega: new Date(datos.pedido.fechaEntrega), // Asegurarse de que se actualice la fecha de entrega
          idCliente: datos.pedido.idCliente,
          vendedor: datos.pedido.vendedor || datos.pedido.idUsuario, // Usar idUsuario si vendedor no está disponible
          idEstadoPedido: datos.pedido.idEstadoPedido,
          observacion: datos.pedido.observacion || "",
          montoTotal: datos.pedido.montoTotal,
        },
      })

      // Si hay detalles nuevos, actualizar los detalles
      if (datos.detalles && datos.detalles.length > 0) {
        // Eliminar detalles existentes
        await prisma.pedidoDetalle.deleteMany({
          where: {
            idPedido: idPedido,
          },
        })

        // Crear nuevos detalles
        const detallesPromises = datos.detalles.map((detalle) =>
          prisma.pedidoDetalle.create({
            data: {
              idPedido: idPedido,
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad,
              subtotal: detalle.precioUnitario * detalle.cantidad, // Calcular subtotal
            },
          }),
        )

        const detallesCreados = await Promise.all(detallesPromises)

        return { pedido: pedidoActualizado, detalles: detallesCreados }
      }

      return { pedido: pedidoActualizado }
    })

    console.log(`API: Pedido con ID ${idPedido} actualizado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Pedido actualizado exitosamente",
        pedido: resultado.pedido,
        detalles: resultado.detalles,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`API: Error al actualizar pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/pedidos/[id] - Eliminar un pedido (borrado lógico)
export async function DELETE(request, { params }) {
  let idPedido
  try {
    // Extraer y convertir el ID de manera segura
    const resolvedParams = await params
    const paramId = resolvedParams ? String(resolvedParams.id || "0") : "0"
    idPedido = Number.parseInt(paramId)

    if (!idPedido) {
      return NextResponse.json({ error: "ID de pedido no válido" }, { status: 400 })
    }

    console.log(`API: Eliminando pedido con ID ${idPedido}...`)

    // Verificar si el pedido existe
    const pedidoExistente = await prisma.pedidoCliente.findUnique({
      where: {
        idPedido: idPedido,
        deletedAt: null,
      },
    })

    if (!pedidoExistente) {
      console.log(`API: Pedido con ID ${idPedido} no encontrado para eliminar`)
      return NextResponse.json({ error: `Pedido con ID ${idPedido} no encontrado` }, { status: 404 })
    }

    // Realizar borrado lógico
    await prisma.pedidoCliente.update({
      where: {
        idPedido: idPedido,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    console.log(`API: Pedido con ID ${idPedido} eliminado correctamente`)
    return NextResponse.json(
      {
        mensaje: "Pedido eliminado exitosamente",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error(`API: Error al eliminar pedido con ID ${idPedido || "desconocido"}:`, error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

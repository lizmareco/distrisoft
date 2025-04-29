import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/pedidos - Obtener todos los pedidos
export async function GET() {
  try {
    console.log("API: Obteniendo pedidos...")
    // Modificar la consulta para usar los nombres de campos correctos
    const pedidos = await prisma.pedidoCliente.findMany({
      where: {
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
          },
        },
        // Seleccionar solo los campos necesarios del estado de pedido
        estadoPedido: {
          select: {
            idEstadoPedido: true,
            descEstadoPedido: true, // Usar descEstadoPedido en lugar de nombre
          },
        },
      },
      orderBy: {
        fechaPedido: "desc",
      },
    })

    console.log(`API: Se encontraron ${pedidos.length} pedidos`)
    return NextResponse.json(pedidos)
  } catch (error) {
    console.error("API: Error al obtener pedidos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/pedidos - Crear un nuevo pedido
export async function POST(request) {
  try {
    console.log("API: Creando nuevo pedido...")
    const datos = await request.json()
    console.log("API: Datos recibidos:", datos)

    // Validar datos
    if (!datos.pedido || !datos.detalles || datos.detalles.length === 0) {
      console.error("API: Datos de pedido incompletos")
      return NextResponse.json({ error: "Datos de pedido incompletos" }, { status: 400 })
    }

    // Crear transacción para asegurar que se guarden tanto el pedido como sus detalles
    const resultado = await prisma.$transaction(async (prisma) => {
      // Crear el pedido sin incluir idMetodoPago
      const pedido = await prisma.pedidoCliente.create({
        data: {
          fechaPedido: new Date(datos.pedido.fechaPedido),
          idCliente: datos.pedido.idCliente,
          idEstadoPedido: datos.pedido.idEstadoPedido,
          observacion: datos.pedido.observacion || "",
          montoTotal: datos.pedido.montoTotal || 0,
          vendedor: datos.pedido.vendedor || datos.pedido.idUsuario, // Usar idUsuario si vendedor no está disponible
          // No incluir idMetodoPago
        },
      })

      // Crear los detalles del pedido
      const detallesPromises = datos.detalles.map((detalle) =>
        prisma.pedidoDetalle.create({
          data: {
            idPedidoCliente: pedido.idPedido, // Usar idPedido en lugar de idPedidoCliente
            idProducto: detalle.idProducto,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
          },
        }),
      )

      const detallesCreados = await Promise.all(detallesPromises)

      return { pedido, detalles: detallesCreados }
    })

    console.log(`API: Pedido creado con ID: ${resultado.pedido.idPedido}`)
    return NextResponse.json(
      {
        mensaje: "Pedido creado exitosamente",
        pedido: resultado.pedido,
        detalles: resultado.detalles,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("API: Error al crear pedido:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

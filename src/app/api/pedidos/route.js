import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
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

// GET /api/pedidos - Obtener todos los pedidos
export async function GET(request) {
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

    // Convertir las fechas a strings simples sin procesar
    const pedidosFormateados = pedidos.map((pedido) => {
      // Función para convertir fecha a string en formato YYYY-MM-DD
      const formatearFechaSimple = (fecha) => {
        if (!fecha) return null
        // Convertir directamente a string y tomar solo la parte de la fecha
        return fecha.toISOString().split("T")[0]
      }

      // Imprimir la fecha original para depuración
      console.log("Fecha original:", pedido.fechaPedido)

      return {
        ...pedido,
        // Convertir fechas a strings simples
        fechaPedido: formatearFechaSimple(pedido.fechaPedido),
        fechaEntrega: formatearFechaSimple(pedido.fechaEntrega),
        // Otras fechas como ISO strings
        createdAt: pedido.createdAt ? pedido.createdAt.toISOString() : null,
        updatedAt: pedido.updatedAt ? pedido.updatedAt.toISOString() : null,
        deletedAt: pedido.deletedAt ? pedido.deletedAt.toISOString() : null,
      }
    })

    // Imprimir un ejemplo de pedido para depuración
    if (pedidosFormateados.length > 0) {
      console.log("API: Ejemplo de pedido formateado:", {
        idPedido: pedidosFormateados[0].idPedido,
        fechaPedido: pedidosFormateados[0].fechaPedido,
        fechaEntrega: pedidosFormateados[0].fechaEntrega,
      })
    }

    console.log(`API: Se encontraron ${pedidos.length} pedidos`)
    return NextResponse.json(pedidosFormateados)
  } catch (error) {
    console.error("API: Error al obtener pedidos:", error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}

// POST /api/pedidos - Crear un nuevo pedido
export async function POST(request) {
  try {
    console.log("API: Creando nuevo pedido...")
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    const datos = await request.json()
    console.log("API: Datos recibidos:", datos)

    // Validar datos
    if (!datos.pedido || !datos.detalles || datos.detalles.length === 0) {
      console.error("API: Datos de pedido incompletos")
      return NextResponse.json({ error: "Datos de pedido incompletos" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Crear transacción para asegurar que se guarden tanto el pedido como sus detalles
    const resultado = await prisma.$transaction(async (prisma) => {
      // Usar la fecha actual si no se proporciona una fecha válida
      const fechaPedido = new Date()
      console.log("API: Usando fecha actual para el pedido:", fechaPedido.toISOString())

      // Procesar la fecha de entrega si existe
      let fechaEntrega = null
      if (datos.pedido.fechaEntrega) {
        try {
          fechaEntrega = new Date(datos.pedido.fechaEntrega)
          console.log("API: Fecha de entrega procesada:", fechaEntrega.toISOString())
        } catch (error) {
          console.warn("API: Error al procesar fecha de entrega, se usará null:", error.message)
        }
      }

      // Crear el pedido sin incluir idMetodoPago
      const pedido = await prisma.pedidoCliente.create({
        data: {
          fechaPedido: new Date(),
          fechaEntrega: fechaEntrega,
          idCliente: datos.pedido.idCliente,
          idEstadoPedido: datos.pedido.idEstadoPedido,
          observacion: datos.pedido.observacion || "",
          montoTotal: datos.pedido.montoTotal || 0,
          vendedor: idUsuario, // ← SIEMPRE el usuario autenticado
        },
      })

      console.log("API: Pedido creado:", pedido)

      // Crear los detalles del pedido
      const detallesCreados = []

      for (const detalle of datos.detalles) {
        // Calcular el subtotal para cada detalle
        const subtotal = detalle.cantidad * detalle.precioUnitario

        try {
          // Crear el detalle del pedido usando solo los campos que existen en el modelo
          const detalleCreado = await prisma.pedidoDetalle.create({
            data: {
              idPedido: pedido.idPedido,
              idProducto: detalle.idProducto,
              cantidad: detalle.cantidad,
              subtotal: subtotal,
            },
          })

          console.log("API: Detalle creado:", detalleCreado)
          detallesCreados.push(detalleCreado)
        } catch (error) {
          console.error("API: Error al crear detalle:", error)
          throw error
        }
      }

      return { pedido, detalles: detallesCreados }
    })

    // Registrar auditoría
      await auditoriaService.registrarCreacion(
        "PedidoCliente",
        resultado.pedido.idPedido,
        {
          pedido: resultado.pedido,
          detalles: resultado.detalles,
        },
        idUsuario,
        auditoriaService.obtenerDireccionIP(request),
        auditoriaService.obtenerInfoNavegador(request)
      )

    console.log(`API: Pedido creado con ID: ${resultado.pedido.idPedido}`)
    return NextResponse.json(
      {
        mensaje: "Pedido creado exitosamente",
        pedido: resultado.pedido,
        detalles: resultado.detalles,
      },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear pedido:", error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const authController = new AuthController()
const auditoriaService = new AuditoriaService()

// GET /api/pedidos - Obtener todos los pedidos
export async function GET(request) {
  try {
    console.log("API: Obteniendo pedidos...")

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    let userData = null

    if (process.env.NODE_ENV === "development") {
      if (!token) {
        console.log("Modo desarrollo: Usando token especial de desarrollo")
        userData = {
          idUsuario: 1,
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"],
        }
      } else {
        userData = await authController.getUserFromToken(token)
      }
    } else {
      if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }
      userData = await authController.getUserFromToken(token)
    }

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

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    let userData = null

    if (process.env.NODE_ENV === "development") {
      if (!token) {
        console.log("Modo desarrollo: Usando token especial de desarrollo")
        userData = {
          idUsuario: 1,
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"],
        }
      } else {
        userData = await authController.getUserFromToken(token)
      }
    } else {
      if (!token) {
        return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
      }
      userData = await authController.getUserFromToken(token)
    }

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
          fechaPedido: fechaPedido,
          fechaEntrega: fechaEntrega, // Incluir fecha de entrega si existe
          idCliente: datos.pedido.idCliente,
          idEstadoPedido: datos.pedido.idEstadoPedido,
          observacion: datos.pedido.observacion || "",
          montoTotal: datos.pedido.montoTotal || 0,
          vendedor: datos.pedido.vendedor || datos.pedido.idUsuario || userData.idUsuario, // Usar idUsuario si vendedor no está disponible
          // No incluir idMetodoPago
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
              // No incluir precioUnitario ya que no existe en el modelo
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
    if (userData) {
      await auditoriaService.registrarAuditoria({
        entidad: "PedidoCliente",
        idRegistro: resultado.pedido.idPedido,
        accion: "CREACION",
        valorAnterior: null,
        valorNuevo: {
          pedido: resultado.pedido,
          detalles: resultado.detalles,
        },
        idUsuario: userData.idUsuario,
        request,
      })
    }

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

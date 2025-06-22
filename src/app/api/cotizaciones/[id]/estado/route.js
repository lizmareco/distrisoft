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

// Función para extraer IP del request
function extraerIP(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  let ip = null
  if (cfConnectingIP) ip = cfConnectingIP
  else if (forwarded) ip = forwarded.split(",")[0].trim()
  else if (realIP) ip = realIP
  else ip = "IP no disponible"

  // Convertir IPv6 localhost a IPv4
  if (ip === "::1") ip = "127.0.0.1"
  // Convertir IPv4-mapeado en IPv6 (ejemplo ::ffff:192.168.0.1)
  if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "")

  return ip
}

// Función para detectar navegador del User-Agent
function detectarNavegador(userAgent) {
  if (!userAgent) return "Navegador no disponible"

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    const match = userAgent.match(/Chrome\/([0-9.]+)/)
    return `Google Chrome ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Edg")) {
    const match = userAgent.match(/Edg\/([0-9.]+)/)
    return `Microsoft Edge ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Firefox")) {
    const match = userAgent.match(/Firefox\/([0-9.]+)/)
    return `Mozilla Firefox ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/([0-9.]+)/)
    return `Safari ${match ? match[1] : "versión desconocida"}`
  }

  if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    const match = userAgent.match(/(?:OPR|Opera)\/([0-9.]+)/)
    return `Opera ${match ? match[1] : "versión desconocida"}`
  }

  return "Navegador no identificado"
}

// Función para crear pedido automáticamente
async function crearPedidoAutomatico(cotizacion, idUsuario, request) {
  try {
    console.log(`API: Creando pedido automático para cotización ${cotizacion.idCotizacionCliente}`)
    
    // Verificar que la cotización tenga detalles
    if (!cotizacion.detalleCotizacionCliente || cotizacion.detalleCotizacionCliente.length === 0) {
      throw new Error("La cotización no tiene detalles para crear el pedido")
    }

    // Obtener el ID del estado "PENDIENTE" para pedidos (asumiendo que es el ID 1)
    const estadoPendiente = await prisma.estadoPedido.findFirst({
      where: {
        idEstadoPedido: 1,
      },
    })

    if (!estadoPendiente) {
      throw new Error("No se encontró el estado 'PENDIENTE' para pedidos")
    }

    // Crear el pedido en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear el pedido
      const pedido = await tx.pedidoCliente.create({
        data: {
          fechaPedido: new Date(),
          fechaEntrega: null, // Se puede calcular basado en la validez de la cotización
          idCliente: cotizacion.idCliente,
          idEstadoPedido: estadoPendiente.idEstadoPedido,
          observacion: `Pedido generado automáticamente al aprobar la cotización #${cotizacion.idCotizacionCliente}`,
          montoTotal: cotizacion.montoTotal,
          vendedor: idUsuario,
        },
      })

      console.log("API: Pedido creado:", pedido)

      // Crear los detalles del pedido basados en los detalles de la cotización
      const detallesCreados = []

      for (const detalleCotizacion of cotizacion.detalleCotizacionCliente) {
        try {
          // Calcular el precio unitario (subtotal / cantidad)
          const precioUnitario = detalleCotizacion.subtotal / detalleCotizacion.cantidad

          const detalleCreado = await tx.pedidoDetalle.create({
            data: {
              idPedido: pedido.idPedido,
              idProducto: detalleCotizacion.idProducto,
              cantidad: detalleCotizacion.cantidad,
              subtotal: detalleCotizacion.subtotal,
            },
          })

          console.log("API: Detalle de pedido creado:", detalleCreado)
          detallesCreados.push(detalleCreado)
        } catch (error) {
          console.error("API: Error al crear detalle de pedido:", error)
          throw error
        }
      }

      return { pedido, detalles: detallesCreados }
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    // Registrar la acción en auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "PedidoCliente",
      resultado.pedido.idPedido,
      {
        pedido: resultado.pedido,
        detalles: resultado.detalles,
        cotizacionOrigen: cotizacion.idCotizacionCliente,
      },
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Pedido automático creado con ID: ${resultado.pedido.idPedido}`)
    return resultado
  } catch (error) {
    console.error(`API: Error al crear pedido automático:`, error)
    throw error
  }
}

export async function PUT(request, { params }) {
  try {
    console.log(`API: Actualizando estado de cotización ${params.id}`)
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener el estado anterior para la auditoría
    const cotizacionAnterior = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: Number.parseInt(params.id),
      },
      include: {
        cliente: {
          include: {
            persona: {
              include: {
                tipoDocumento: true,
              },
            },
            empresa: true,
            sectorCliente: true,
          },
        },
        usuario: {
          include: {
            persona: true,
          },
        },
        estadoCotizacionCliente: true,
        detalleCotizacionCliente: {
          include: {
            producto: {
              include: {
                unidadMedida: true,
              },
            },
          },
        },
      },
    })

    if (!cotizacionAnterior) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    const body = await request.json()

    // Obtener el estado como string o como ID
    const { estado } = body

    // Determinar el ID del estado según el valor recibido
    let idEstadoCotizacionCliente

    if (typeof estado === "number") {
      // Si ya es un número, usarlo directamente
      idEstadoCotizacionCliente = estado
    } else {
      // Si es un string, buscar el ID correspondiente
      const estadoMap = {
        PENDIENTE: 1,
        APROBADA: 2,
        RECHAZADA: 3,
        VENCIDA: 4,
      }

      idEstadoCotizacionCliente = estadoMap[estado] || 1 // Default a PENDIENTE si no se encuentra
    }

    console.log(`API: Actualizando estado de cotización ${params.id} a ${estado} (ID: ${idEstadoCotizacionCliente})`)

    // Actualizar la cotización
    const cotizacion = await prisma.cotizacionCliente.update({
      where: {
        idCotizacionCliente: Number.parseInt(params.id),
      },
      data: {
        idEstadoCotizacionCliente,
      },
      include: {
        cliente: {
          include: {
            persona: {
              include: {
                tipoDocumento: true,
              },
            },
            empresa: true,
            sectorCliente: true,
          },
        },
        usuario: {
          include: {
            persona: true,
          },
        },
        estadoCotizacionCliente: true,
        detalleCotizacionCliente: {
          include: {
            producto: {
              include: {
                unidadMedida: true,
              },
            },
          },
        },
      },
    })

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría usando el método correcto
    await auditoriaService.registrarActualizacion(
      "CotizacionCliente",
      params.id,
      {
        idEstado: cotizacionAnterior.estadoCotizacionCliente.idEstadoCotizacionCliente,
        estado: cotizacionAnterior.estadoCotizacionCliente.descEstadoCotizacionCliente,
      },
      {
        idEstado: cotizacion.estadoCotizacionCliente.idEstadoCotizacionCliente,
        estado: cotizacion.estadoCotizacionCliente.descEstadoCotizacionCliente,
      },
      idUsuario,
      direccionIP,
      navegador
    )

    // --- CREAR PEDIDO AUTOMÁTICAMENTE SI SE APRUEBA ---
    let pedidoCreado = null
    if (idEstadoCotizacionCliente === 2) { // APROBADA
      try {
        pedidoCreado = await crearPedidoAutomatico(cotizacion, idUsuario, request)
        console.log(`API: Pedido creado automáticamente: ${pedidoCreado.pedido.idPedido}`)
      } catch (error) {
        console.error(`API: Error al crear pedido automático:`, error)
        // No fallamos la actualización del estado por un error en la creación del pedido
        // Solo registramos el error
      }
    }

    console.log(
      `API: Estado de cotización ${params.id} actualizado exitosamente a ${cotizacion.estadoCotizacionCliente.descEstadoCotizacionCliente}`,
    )
    
    // Devolver la cotización actualizada junto con información sobre el pedido creado
    const respuesta = {
      ...cotizacion,
      pedidoCreado: pedidoCreado ? {
        idPedido: pedidoCreado.pedido.idPedido,
        mensaje: "Pedido creado automáticamente"
      } : null
    }
    
    return NextResponse.json(respuesta)
  } catch (error) {
    console.error(`API: Error al actualizar estado de cotización:`, error)
    return NextResponse.json(
      { message: "Error al actualizar estado de cotización", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

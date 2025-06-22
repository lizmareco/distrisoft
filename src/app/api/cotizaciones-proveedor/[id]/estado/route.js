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

// Función para crear orden de compra automáticamente
async function crearOrdenCompraAutomatica(idCotizacionProveedor, idUsuario, request) {
  try {
    console.log(`API: Creando orden de compra automática para cotización ${idCotizacionProveedor}`)
    
    // Verificar que no existe ya una orden de compra para esta cotización
    const ordenExistente = await prisma.ordenCompra.findFirst({
      where: {
        idCotizacionProveedor: Number.parseInt(idCotizacionProveedor),
        deletedAt: null,
      },
    })

    if (ordenExistente) {
      console.log(`API: Ya existe una orden de compra para la cotización ${idCotizacionProveedor}`)
      return ordenExistente
    }

    // Obtener el ID del estado "PENDIENTE" (asumiendo que es el ID 1)
    const estadoPendiente = await prisma.estadoOrdenCompra.findFirst({
      where: {
        idEstadoOrdenCompra: 1,
      },
    })

    if (!estadoPendiente) {
      throw new Error("No se encontró el estado 'PENDIENTE' para órdenes de compra")
    }

    // Crear la orden de compra
    const ordenCompra = await prisma.ordenCompra.create({
      data: {
        fechaOrden: new Date(),
        idEstadoOrdenCompra: estadoPendiente.idEstadoOrdenCompra,
        idCotizacionProveedor: Number.parseInt(idCotizacionProveedor),
        observacion: "Orden de compra generada automáticamente al aprobar la cotización",
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    // Registrar la acción en auditoría
    const auditoriaService = new AuditoriaService()
    await auditoriaService.registrarCreacion(
      "OrdenCompra",
      ordenCompra.idOrdenCompra,
      ordenCompra,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Orden de compra automática creada con ID: ${ordenCompra.idOrdenCompra}`)
    return ordenCompra
  } catch (error) {
    console.error(`API: Error al crear orden de compra automática:`, error)
    throw error
  }
}

export async function PUT(request, { params }) {
  try {
    console.log(`API: Actualizando estado de cotización de proveedor ${params.id}`)
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener la cotización anterior (sólo el estado y proveedor)
    const cotizacionAnterior = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(params.id),
      },
      select: {
        estado: true,
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
    })

    if (!cotizacionAnterior) {
      return NextResponse.json(
        { message: "Cotización de proveedor no encontrada" },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    const body = await request.json()
    const { estado } = body

    // Validar el estado recibido
    const estadosValidos = ["PENDIENTE", "APROBADA", "RECHAZADA", "VENCIDA"]
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { message: "Estado no válido. Debe ser PENDIENTE, APROBADA, RECHAZADA o VENCIDA" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Actualizar el estado de la cotización
    const cotizacion = await prisma.cotizacionProveedor.update({
      where: {
        idCotizacionProveedor: Number.parseInt(params.id),
      },
      data: {
        estado,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
    })

    // --- Auditoría solo del campo estado ---
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    await auditoriaService.registrarActualizacion(
      "CotizacionProveedor",
      params.id,
      { estado: cotizacionAnterior.estado },
      { estado: cotizacion.estado },
      idUsuario,
      direccionIP,
      navegador,
    )

    // --- CREAR ORDEN DE COMPRA AUTOMÁTICAMENTE SI SE APRUEBA ---
    let ordenCompraCreada = null
    if (estado === "APROBADA") {
      try {
        ordenCompraCreada = await crearOrdenCompraAutomatica(params.id, idUsuario, request)
        console.log(`API: Orden de compra creada automáticamente: ${ordenCompraCreada.idOrdenCompra}`)
      } catch (error) {
        console.error(`API: Error al crear orden de compra automática:`, error)
        // No fallamos la actualización del estado por un error en la creación de la orden
        // Solo registramos el error
      }
    }

    console.log(`API: Estado de cotización de proveedor ${params.id} actualizado exitosamente a ${estado}`)
    
    // Devolver la cotización actualizada junto con información sobre la orden de compra creada
    const respuesta = {
      ...cotizacion,
      ordenCompraCreada: ordenCompraCreada ? {
        idOrdenCompra: ordenCompraCreada.idOrdenCompra,
        mensaje: "Orden de compra creada automáticamente"
      } : null
    }
    
    return NextResponse.json(respuesta)
  } catch (error) {
    console.error(`API: Error al actualizar estado de cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al actualizar estado de cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

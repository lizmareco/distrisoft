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

// GET - Obtener órdenes de compra con filtros
export async function GET(request) {
  try {
    console.log("API: Obteniendo órdenes de compra...")

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "0")
    const limit = parseInt(searchParams.get("limit") || "10")
    const idCotizacion = searchParams.get("idCotizacion") || ""
    const estado = searchParams.get("estado") || ""
    const idProveedor = searchParams.get("idProveedor") || ""
    const idOrdenCompra = searchParams.get("idOrdenCompra") || ""
    const mostrarTodas = searchParams.get("mostrarTodas") === "true"

    console.log("API: Parámetros recibidos:", {
      page,
      limit,
      idCotizacion,
      estado,
      idProveedor,
      idOrdenCompra,
      mostrarTodas
    })

    // Construir condiciones de búsqueda
    let whereCondition = {
      deletedAt: null,
    }

    // Filtrar por ID de orden de compra si se proporciona
    if (idOrdenCompra) {
      whereCondition.idOrdenCompra = Number.parseInt(idOrdenCompra)
    }

    // Filtrar por ID de cotización si se proporciona
    if (idCotizacion) {
      whereCondition.idCotizacionProveedor = Number.parseInt(idCotizacion)
    }

    // Filtrar por estado si se proporciona
    if (estado) {
      whereCondition.estadoOrdenCompra = {
        descEstadoOrdenCompra: estado,
      }
    }

    // Filtrar por proveedor si se proporciona
    if (idProveedor) {
      whereCondition.cotizacionProveedor = {
        idProveedor: Number.parseInt(idProveedor),
      }
    }

    // Solo aplicar el filtro de fecha si no se solicita mostrar todas
    if (!mostrarTodas) {
      whereCondition = {
        ...whereCondition,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }
    }

    console.log("API: Condición de búsqueda:", JSON.stringify(whereCondition, null, 2))

    // Obtener el total de registros que coinciden con los filtros
    const total = await prisma.ordenCompra.count({
      where: whereCondition,
    })

    // Obtener órdenes de compra con paginación
    const ordenesCompra = await prisma.ordenCompra.findMany({
      where: whereCondition,
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        estadoOrdenCompra: true,
      },
      orderBy: {
        fechaOrden: "desc",
      },
      skip: page * limit,
      take: limit,
    })

    console.log(`API: Se encontraron ${total} órdenes de compra (mostrando ${ordenesCompra.length})`)
    return NextResponse.json({
      ordenes: ordenesCompra,
      total: total,
      page: page,
      limit: limit
    }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener órdenes de compra:", error)
    return NextResponse.json(
      { error: "Error al obtener órdenes de compra" },
      { status: HTTP_STATUS_CODES.internal_server_error }
    )
  }
}

// POST - Crear una nueva orden de compra
export async function POST(request) {
  try {
    console.log("API: Creando nueva orden de compra...")
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener datos de la orden de compra
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idCotizacionProveedor) {
      return NextResponse.json(
        { message: "Se requiere el ID de la cotización del proveedor" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que la cotización existe y está aprobada
    const cotizacion = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(data.idCotizacionProveedor),
        deletedAt: null,
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    if (cotizacion.estado !== "APROBADA") {
      return NextResponse.json(
        { message: "Solo se pueden crear órdenes de compra a partir de cotizaciones aprobadas" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar si ya existe una orden de compra para esta cotización
    const ordenExistente = await prisma.ordenCompra.findFirst({
      where: {
        idCotizacionProveedor: Number.parseInt(data.idCotizacionProveedor),
        deletedAt: null,
      },
    })

    if (ordenExistente) {
      return NextResponse.json(
        { message: "Ya existe una orden de compra para esta cotización" },
        { status: HTTP_STATUS_CODES.conflict },
      )
    }

    // Obtener el ID del estado "PENDIENTE" (asumiendo que es el ID 1)
    const estadoPendiente = await prisma.estadoOrdenCompra.findFirst({
      where: {
        idEstadoOrdenCompra: 1,
      },
    })

    if (!estadoPendiente) {
      return NextResponse.json(
        { message: "No se encontró el estado 'PENDIENTE' para órdenes de compra" },
        { status: HTTP_STATUS_CODES.internalServerError },
      )
    }

    // Crear la orden de compra
    const ordenCompra = await prisma.ordenCompra.create({
      data: {
        fechaOrden: new Date(),
        idEstadoOrdenCompra: estadoPendiente.idEstadoOrdenCompra,
        idCotizacionProveedor: Number.parseInt(data.idCotizacionProveedor),
        observacion: data.observacion || "",
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const userAgent = request.headers.get("user-agent")
    const navegador = detectarNavegador(userAgent)

    console.log("DEBUG - Datos para auditoría:", {
      direccionIP: typeof direccionIP,
      navegador: typeof navegador,
      idOrden: typeof ordenCompra.idOrdenCompra,
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion(
      "OrdenCompra",
      ordenCompra.idOrdenCompra,
      ordenCompra,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Orden de compra creada con ID: ${ordenCompra.idOrdenCompra}`)
    return NextResponse.json(
      { message: "Orden de compra creada exitosamente", idOrdenCompra: ordenCompra.idOrdenCompra },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear orden de compra:", error)
    return NextResponse.json(
      { message: "Error al crear orden de compra", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

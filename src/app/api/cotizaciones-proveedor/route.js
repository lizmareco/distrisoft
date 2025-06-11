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


// Función para detectar el navegador desde el User-Agent
function detectarNavegador(userAgent) {
  if (!userAgent) return "Navegador no disponible"

  const ua = userAgent.toLowerCase()

  if (ua.includes("edg/")) {
    const version = userAgent.match(/edg\/([0-9.]+)/i)
    return `Microsoft Edge ${version ? version[1] : ""}`
  } else if (ua.includes("chrome/") && !ua.includes("edg/")) {
    const version = userAgent.match(/chrome\/([0-9.]+)/i)
    return `Google Chrome ${version ? version[1] : ""}`
  } else if (ua.includes("firefox/")) {
    const version = userAgent.match(/firefox\/([0-9.]+)/i)
    return `Mozilla Firefox ${version ? version[1] : ""}`
  } else if (ua.includes("safari/") && !ua.includes("chrome/")) {
    const version = userAgent.match(/version\/([0-9.]+)/i)
    return `Safari ${version ? version[1] : ""}`
  } else if (ua.includes("opera/") || ua.includes("opr/")) {
    const version = userAgent.match(/(opera|opr)\/([0-9.]+)/i)
    return `Opera ${version ? version[2] : ""}`
  } else if (ua.includes("trident/") || ua.includes("msie")) {
    return "Internet Explorer"
  } else {
    return "Navegador desconocido"
  }
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

// GET - Obtener cotizaciones de proveedores con filtro de búsqueda
export async function GET(request) {
  try {
    console.log("API: Obteniendo cotizaciones de proveedores...")

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("search") || ""

    // Condición base: solo cotizaciones no eliminadas
    let whereCondition = {
      deletedAt: null,
    }

    // Si hay término de búsqueda, aplicar filtros adicionales
    if (searchTerm) {
      // Intentar convertir el término de búsqueda a número para buscar por ID
      const searchId = !isNaN(Number.parseInt(searchTerm)) ? Number.parseInt(searchTerm) : undefined

      // Construir condiciones de búsqueda
      whereCondition = {
        deletedAt: null,
        OR: [
          // Búsqueda por ID de cotización
          ...(searchId ? [{ idCotizacionProveedor: searchId }] : []),
          // Búsqueda por empresa (razón social)
          {
            proveedor: {
              empresa: {
                razonSocial: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
          // Búsqueda por contacto de empresa
          {
            proveedor: {
              empresa: {
                contacto: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
        ],
      }
    }

    console.log("API: Condición de búsqueda:", JSON.stringify(whereCondition, null, 2))

    // Obtener cotizaciones con sus relaciones y aplicar filtro de búsqueda
    const cotizaciones = await prisma.cotizacionProveedor.findMany({
      where: whereCondition,
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
      orderBy: {
        fechaCotizacionProveedor: "desc",
      },
    })

    console.log(
      `API: Se encontraron ${cotizaciones.length} cotizaciones${searchTerm ? ` para el término "${searchTerm}"` : ""}`,
    )
    return NextResponse.json(cotizaciones, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener cotizaciones de proveedores:", error)
    return NextResponse.json(
      { message: "Error al obtener cotizaciones de proveedores", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear una nueva cotización de proveedor
export async function POST(request) {
  try {
    console.log("API: Creando nueva cotización de proveedor...")
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    // Obtener datos de la cotización
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idProveedor || !data.validez || !data.materiasPrimas || data.materiasPrimas.length === 0) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Crear la cotización con estado PENDIENTE
    const cotizacion = await prisma.cotizacionProveedor.create({
      data: {
        idProveedor: Number.parseInt(data.idProveedor),
        fechaCotizacionProveedor: new Date(),
        validez: Number.parseInt(data.validez),
        montoTotal: data.montoTotal || data.materiasPrimas.reduce((total, item) => total + item.subtotal, 0),
        estado: "PENDIENTE",
      },
    })

    // Crear los detalles de la cotización para cada materia prima
    for (const materiaPrima of data.materiasPrimas) {
      await prisma.detalleCotizacionProv.create({
        data: {
          idCotizacionProveedor: cotizacion.idCotizacionProveedor,
          idMateriaPrima: Number.parseInt(materiaPrima.idMateriaPrima),
          cantidad: Number.parseInt(materiaPrima.cantidad),
          precioUnitario: Number.parseFloat(materiaPrima.precioUnitario),
          subtotal: Number.parseFloat(materiaPrima.subtotal),
        },
      })
    }

    // Obtener la cotización básica para la auditoría (sin incluir detalles)
    const cotizacionBasica = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: cotizacion.idCotizacionProveedor,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const navegador = detectarNavegador(request.headers.get("user-agent"))

    // Registrar la acción en auditoría usando el método específico
    await auditoriaService.registrarCreacion(
      "CotizacionProveedor",
      cotizacion.idCotizacionProveedor,
      cotizacionBasica,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Cotización de proveedor creada con ID: ${cotizacion.idCotizacionProveedor}`)
    return NextResponse.json(
      {
        message: "Cotización de proveedor creada exitosamente",
        idCotizacionProveedor: cotizacion.idCotizacionProveedor,
      },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear cotización de proveedor:", error)
    return NextResponse.json(
      { message: "Error al crear cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

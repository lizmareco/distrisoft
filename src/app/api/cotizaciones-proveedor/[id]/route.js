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



// GET - Obtener una cotización específica
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo cotización de proveedor con ID: ${id}`)

    if (!id || isNaN(Number.parseInt(id))) {
      return NextResponse.json(
        { message: "ID de cotización de proveedor inválido" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Intentar obtener la cotización con sus detalles usando el nombre correcto de la relación
    const cotizacion = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
        detallesCotizacionProv: {
          // Nombre correcto en plural
          where: {
            deletedAt: null,
          },
          include: {
            materiaPrima: {
              include: {
                estadoMateriaPrima: true,
              },
            },
          },
        },
      },
    })

    if (!cotizacion) {
      console.error(`API: Cotización de proveedor con ID ${id} no encontrada`)
      return NextResponse.json(
        { message: "Cotización de proveedor no encontrada" },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    console.log(`API: Cotización de proveedor encontrada: ${cotizacion.idCotizacionProveedor}`)
    console.log(`API: Detalles encontrados: ${cotizacion.detallesCotizacionProv.length}`)

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error(`API: Error al obtener cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al obtener cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

function limpiarParaAuditoria(cotizacion) {
  // Sólo dejamos campos básicos (puedes agregar/quitar según tu modelo)
  return {
    idCotizacionProveedor: cotizacion.idCotizacionProveedor,
    estado: cotizacion.estado,
    fechaCotizacionProveedor: cotizacion.fechaCotizacionProveedor,
    montoTotal: cotizacion.montoTotal,
    validez: cotizacion.validez,
    idProveedor: cotizacion.idProveedor,
    proveedor: cotizacion.proveedor
      ? {
          idProveedor: cotizacion.proveedor.idProveedor,
          empresa: cotizacion.proveedor.empresa
            ? {
                idEmpresa: cotizacion.proveedor.empresa.idEmpresa,
                razonSocial: cotizacion.proveedor.empresa.razonSocial,
              }
            : undefined,
        }
      : undefined,
    detallesCotizacionProv: cotizacion.detallesCotizacionProv?.map((det) => ({
      idDetalleCotizacionProv: det.idDetalleCotizacionProv,
      idMateriaPrima: det.idMateriaPrima,
      cantidad: det.cantidad,
      precioUnitario: det.precioUnitario,
      subtotal: det.subtotal,
      materiaPrima: det.materiaPrima
        ? {
            idMateriaPrima: det.materiaPrima.idMateriaPrima,
            nombreMateriaPrima: det.materiaPrima.nombreMateriaPrima,
          }
        : undefined,
    })),
  }
}

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

// DELETE - Eliminar una cotización (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando cotización de proveedor con ID: ${id}`)

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener la cotización antes de eliminarla para la auditoría
    const cotizacionAnterior = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(id),
        deletedAt: null,
      },
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
    })

    if (!cotizacionAnterior) {
      return NextResponse.json(
        { message: "Cotización de proveedor no encontrada" },
        { status: HTTP_STATUS_CODES.notFound }
      )
    }

    // Solo se puede eliminar si el estado es PENDIENTE
    if (cotizacionAnterior.estado !== "PENDIENTE") {
      return NextResponse.json(
        { message: "Solo se pueden eliminar cotizaciones en estado PENDIENTE" },
        { status: HTTP_STATUS_CODES.forbidden }
      )
    }

    // Realizar soft delete de la cotización
    await prisma.cotizacionProveedor.update({
      where: {
        idCotizacionProveedor: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Soft delete de los detalles
    await prisma.detalleCotizacionProv.updateMany({
      where: {
        idCotizacionProveedor: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Extraer IP y navegador del request
    const direccionIP = extraerIP(request)
    const navegador = detectarNavegador(request.headers.get("user-agent"))

    // Registrar en auditoría
    await auditoriaService.registrarEliminacion(
      "CotizacionProveedor",
      Number.parseInt(id),
      limpiarParaAuditoria(cotizacionAnterior),
      idUsuario,
      direccionIP,
      navegador
    )

    console.log(`API: Cotización de proveedor con ID ${id} eliminada exitosamente`)
    return NextResponse.json({ message: "Cotización de proveedor eliminada exitosamente" })
  } catch (error) {
    console.error(`API: Error al eliminar cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al eliminar cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError }
    )
  }
}


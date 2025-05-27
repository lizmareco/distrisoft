import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

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

// Función para extraer IP del request
function extraerIP(request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (cfConnectingIP) return cfConnectingIP
  if (forwarded) return forwarded.split(",")[0].trim()
  if (realIP) return realIP

  return "IP no disponible"
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

// DELETE - Eliminar una cotización (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando cotización de proveedor con ID: ${id}`)

    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // Obtener el usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = await authController.getUserFromToken(accessToken)
    if (!userData) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

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
          // Nombre correcto en plural
          include: {
            materiaPrima: true,
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

    // Verificar si la cotización puede ser eliminada (por ejemplo, si está en estado PENDIENTE)
    if (cotizacionAnterior.estado !== "PENDIENTE") {
      return NextResponse.json(
        { message: "Solo se pueden eliminar cotizaciones en estado PENDIENTE" },
        { status: HTTP_STATUS_CODES.forbidden },
      )
    }

    // Realizar soft delete
    const cotizacion = await prisma.cotizacionProveedor.update({
      where: {
        idCotizacionProveedor: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // También marcar como eliminado el detalle de la cotización
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

    // Registrar la acción en auditoría usando el método específico
    await auditoriaService.registrarEliminacion(
      "CotizacionProveedor",
      Number.parseInt(id), // Convertir a número como en CREATE
      cotizacionAnterior,
      userData.idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Cotización de proveedor con ID ${id} eliminada exitosamente`)
    return NextResponse.json({ message: "Cotización de proveedor eliminada exitosamente" })
  } catch (error) {
    console.error(`API: Error al eliminar cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al eliminar cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// PUT - Actualizar una cotización
export async function PUT(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Actualizando cotización de proveedor con ID: ${id}`)

    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // Obtener el usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = await authController.getUserFromToken(accessToken)
    if (!userData) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Obtener datos de la actualización
    const data = await request.json()
    console.log("API: Datos recibidos para actualización:", data)

    // Obtener la cotización antes de actualizarla para la auditoría
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
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    // Verificar si la cotización puede ser actualizada
    if (cotizacionAnterior.estado !== "PENDIENTE") {
      return NextResponse.json(
        { message: "Solo se pueden actualizar cotizaciones en estado PENDIENTE" },
        { status: HTTP_STATUS_CODES.forbidden },
      )
    }

    // Actualizar la cotización
    const cotizacionActualizada = await prisma.cotizacionProveedor.update({
      where: {
        idCotizacionProveedor: Number.parseInt(id),
      },
      data: {
        ...(data.validez && { validez: Number.parseInt(data.validez) }),
        ...(data.montoTotal && { montoTotal: Number.parseFloat(data.montoTotal) }),
        ...(data.estado && { estado: data.estado }),
        updatedAt: new Date(),
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
    await auditoriaService.registrarActualizacion(
      "CotizacionProveedor",
      Number.parseInt(id), // Convertir a número como en CREATE
      cotizacionAnterior,
      cotizacionActualizada,
      userData.idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Cotización de proveedor con ID ${id} actualizada exitosamente`)
    return NextResponse.json({
      message: "Cotización de proveedor actualizada exitosamente",
      cotizacion: cotizacionActualizada,
    })
  } catch (error) {
    console.error(`API: Error al actualizar cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al actualizar cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

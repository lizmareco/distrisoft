import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function PUT(request, { params }) {
  try {
    console.log(`API: Actualizando estado de cotización de proveedor ${params.id}`)
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

    // Obtener el estado anterior para la auditoría - sin incluir detalles inicialmente
    const cotizacionAnterior = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(params.id),
      },
      include: {
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

    // Intentar obtener los detalles por separado
    try {
      const detalles = await prisma.detalleCotizacionProv.findMany({
        where: {
          idCotizacionProveedor: Number.parseInt(params.id),
          deletedAt: null,
        },
        include: {
          materiaPrima: {
            include: {
              estadoMateriaPrima: true,
            },
          },
        },
      })

      // Agregar los detalles manualmente
      if (detalles && detalles.length > 0) {
        cotizacionAnterior.detalles = detalles
      }
    } catch (error) {
      console.log("Error al obtener detalles de la cotización:", error.message)
      // Continuar sin los detalles si hay error
    }

    const body = await request.json()

    // Obtener el nuevo estado
    const { estado } = body

    // Validar que el estado sea válido
    const estadosValidos = ["PENDIENTE", "APROBADA", "RECHAZADA", "VENCIDA"]
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { message: "Estado no válido. Debe ser PENDIENTE, APROBADA, RECHAZADA o VENCIDA" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    console.log(`API: Actualizando estado de cotización de proveedor ${params.id} a ${estado}`)

    // Actualizar la cotización
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

    // Intentar obtener los detalles actualizados por separado
    try {
      const detallesActualizados = await prisma.detalleCotizacionProv.findMany({
        where: {
          idCotizacionProveedor: Number.parseInt(params.id),
          deletedAt: null,
        },
        include: {
          materiaPrima: {
            include: {
              estadoMateriaPrima: true,
            },
          },
        },
      })

      // Agregar los detalles manualmente
      if (detallesActualizados && detallesActualizados.length > 0) {
        cotizacion.detalles = detallesActualizados
      }
    } catch (error) {
      console.log("Error al obtener detalles actualizados de la cotización:", error.message)
      // Continuar sin los detalles si hay error
    }

    // Registrar la acción en auditoría usando el método correcto
    await auditoriaService.registrarActualizacion(
      "CotizacionProveedor",
      params.id,
      cotizacionAnterior,
      cotizacion,
      userData.idUsuario,
      request,
    )

    console.log(`API: Estado de cotización de proveedor ${params.id} actualizado exitosamente a ${estado}`)
    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error(`API: Error al actualizar estado de cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al actualizar estado de cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

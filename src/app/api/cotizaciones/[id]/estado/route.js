import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function PUT(request, { params }) {
  try {
    console.log(`API: Actualizando estado de cotización ${params.id}`)
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

    // Registrar la acción en auditoría usando el método correcto
    await auditoriaService.registrarActualizacion(
      "CotizacionCliente",
      params.id,
      cotizacionAnterior,
      cotizacion,
      userData.idUsuario,
      request,
    )

    console.log(
      `API: Estado de cotización ${params.id} actualizado exitosamente a ${cotizacion.estadoCotizacionCliente.descEstadoCotizacionCliente}`,
    )
    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error(`API: Error al actualizar estado de cotización:`, error)
    return NextResponse.json(
      { message: "Error al actualizar estado de cotización", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener una cotización específica
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo cotización de proveedor con ID: ${id}`)

    // Intentar obtener la cotización con sus detalles
    let cotizacion

    try {
      // Primero intentamos con detalleCotizacionProv
      cotizacion = await prisma.cotizacionProveedor.findUnique({
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
          detalleCotizacionProv: {
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
    } catch (error) {
      console.log("Error al incluir detalleCotizacionProv, intentando sin detalles:", error.message)

      // Si falla, obtenemos la cotización sin detalles
      cotizacion = await prisma.cotizacionProveedor.findUnique({
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
        },
      })

      // Obtener los detalles por separado
      const detalles = await prisma.detalleCotizacionProv.findMany({
        where: {
          idCotizacionProveedor: Number.parseInt(id),
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
      if (cotizacion) {
        cotizacion.detalles = detalles
      }
    }

    if (!cotizacion) {
      console.error(`API: Cotización de proveedor con ID ${id} no encontrada`)
      return NextResponse.json(
        { message: "Cotización de proveedor no encontrada" },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

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
    let cotizacionAnterior

    try {
      cotizacionAnterior = await prisma.cotizacionProveedor.findUnique({
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
          detalleCotizacionProv: {
            include: {
              materiaPrima: true,
            },
          },
        },
      })
    } catch (error) {
      console.log("Error al incluir detalleCotizacionProv, intentando sin detalles:", error.message)

      cotizacionAnterior = await prisma.cotizacionProveedor.findUnique({
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
        },
      })
    }

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

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion(
      "CotizacionProveedor",
      id,
      cotizacionAnterior,
      userData.idUsuario,
      request,
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

// PUT - Actualizar una cotización (rechazar cualquier intento de edición)
export async function PUT(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Intento de actualizar cotización de proveedor con ID: ${id}`)

    // Rechazar cualquier intento de edición
    return NextResponse.json(
      { message: "No se permite editar cotizaciones de proveedores una vez creadas" },
      { status: HTTP_STATUS_CODES.forbidden },
    )
  } catch (error) {
    console.error(`API: Error al actualizar cotización de proveedor:`, error)
    return NextResponse.json(
      { message: "Error al procesar la solicitud", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

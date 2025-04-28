import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener una cotización específica
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo cotización con ID: ${id}`)

    const cotizacion = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: Number.parseInt(id),
        deletedAt: null,
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

    if (!cotizacion) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    console.log(`API: Cotización con ID ${id} encontrada`)
    return NextResponse.json(cotizacion, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error(`API: Error al obtener cotización:`, error)
    return NextResponse.json(
      { message: "Error al obtener cotización", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// PUT - Actualizar una cotización
export async function PUT(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Actualizando cotización con ID: ${id}`)
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

    // Verificar si la cotización existe
    const cotizacionExistente = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        detalleCotizacionCliente: true,
        estadoCotizacionCliente: true,
      },
    })

    if (!cotizacionExistente) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si la cotización está en estado "Pendiente"
    if (cotizacionExistente.estadoCotizacionCliente.descEstadoCotizacionCliente !== "PENDIENTE") {
      return NextResponse.json(
        { message: "Solo se pueden editar cotizaciones en estado Pendiente" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Obtener datos de la cotización
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.validez || !data.productos || data.productos.length === 0) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Guardar el estado anterior para auditoría
    const cotizacionAnterior = { ...cotizacionExistente }

    // Actualizar la cotización
    const cotizacion = await prisma.cotizacionCliente.update({
      where: {
        idCotizacionCliente: Number.parseInt(id),
      },
      data: {
        montoTotal: data.montoTotal,
        validez: Number.parseInt(data.validez),
        updatedAt: new Date(),
      },
    })

    // Eliminar los detalles existentes
    await prisma.detalleCotizacionCliente.deleteMany({
      where: {
        idCotizacionCliente: Number.parseInt(id),
      },
    })

    // Crear los nuevos detalles
    for (const producto of data.productos) {
      await prisma.detalleCotizacionCliente.create({
        data: {
          idCotizacionCliente: Number.parseInt(id),
          idProducto: Number.parseInt(producto.idProducto),
          cantidad: Number.parseInt(producto.cantidad),
          subtotal: Number.parseFloat(producto.subtotal),
        },
      })
    }

    // Obtener la cotización actualizada con sus relaciones para la auditoría
    const cotizacionActualizada = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: Number.parseInt(id),
      },
      include: {
        cliente: {
          include: {
            persona: true,
            empresa: true,
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
            producto: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "CotizacionCliente",
      idRegistro: id.toString(),
      accion: "ACTUALIZAR",
      valorAnterior: cotizacionAnterior,
      valorNuevo: cotizacionActualizada,
      idUsuario: userData.idUsuario,
      request: request,
    })

    console.log(`API: Cotización con ID ${id} actualizada correctamente`)
    return NextResponse.json(
      { message: "Cotización actualizada correctamente", cotizacion: cotizacionActualizada },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error(`API: Error al actualizar cotización:`, error)
    return NextResponse.json(
      { message: "Error al actualizar cotización", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// DELETE - Eliminar una cotización (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando cotización con ID: ${id}`)
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

    // Verificar si la cotización existe
    const cotizacionExistente = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        detalleCotizacionCliente: true,
        estadoCotizacionCliente: true,
      },
    })

    if (!cotizacionExistente) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si la cotización está en estado "Pendiente"
    if (cotizacionExistente.estadoCotizacionCliente.descEstadoCotizacionCliente !== "PENDIENTE") {
      return NextResponse.json(
        { message: "Solo se pueden eliminar cotizaciones en estado Pendiente" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Guardar el estado anterior para auditoría
    const cotizacionAnterior = { ...cotizacionExistente }

    // Eliminar la cotización (soft delete)
    await prisma.cotizacionCliente.update({
      where: {
        idCotizacionCliente: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "CotizacionCliente",
      idRegistro: id.toString(),
      accion: "ELIMINAR",
      valorAnterior: cotizacionAnterior,
      valorNuevo: null,
      idUsuario: userData.idUsuario,
      request: request,
    })

    console.log(`API: Cotización con ID ${id} eliminada correctamente`)
    return NextResponse.json({ message: "Cotización eliminada correctamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error(`API: Error al eliminar cotización:`, error)
    return NextResponse.json(
      { message: "Error al eliminar cotización", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

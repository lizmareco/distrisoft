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



// DELETE - Eliminar una cotización (soft delete)
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando cotización con ID: ${id}`)

    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

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

    // Extraer información del request para auditoría
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría SOLO con los campos del objeto eliminado
    await auditoriaService.registrarEliminacion(
      "CotizacionCliente",
      id.toString(),
      cotizacionAnterior ? { idCotizacionCliente: cotizacionAnterior.idCotizacionCliente } : null,
      idUsuario,
      direccionIP,
      navegador
    )

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

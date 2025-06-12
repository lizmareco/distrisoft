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


export async function PUT(request, { params }) {
  try {
    console.log(`API: Actualizando estado de cotización ${params.id}`)
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

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

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría usando el método correcto
    await auditoriaService.registrarActualizacion(
      "CotizacionCliente",
      params.id,
      {
        idEstado: cotizacionAnterior.estadoCotizacionCliente.idEstadoCotizacionCliente,
        estado: cotizacionAnterior.estadoCotizacionCliente.descEstadoCotizacionCliente,
      },
      {
        idEstado: cotizacion.estadoCotizacionCliente.idEstadoCotizacionCliente,
        estado: cotizacion.estadoCotizacionCliente.descEstadoCotizacionCliente,
      },
      idUsuario,
      direccionIP,
      navegador
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

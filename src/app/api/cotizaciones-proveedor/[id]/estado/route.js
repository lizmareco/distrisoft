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
    console.log(`API: Actualizando estado de cotización de proveedor ${params.id}`)
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    // Obtener la cotización anterior (sólo el estado y proveedor)
    const cotizacionAnterior = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(params.id),
      },
      select: {
        estado: true,
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

    const body = await request.json()
    const { estado } = body

    // Validar el estado recibido
    const estadosValidos = ["PENDIENTE", "APROBADA", "RECHAZADA", "VENCIDA"]
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { message: "Estado no válido. Debe ser PENDIENTE, APROBADA, RECHAZADA o VENCIDA" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Actualizar el estado de la cotización
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

    // --- Auditoría solo del campo estado ---
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    await auditoriaService.registrarActualizacion(
      "CotizacionProveedor",
      params.id,
      { estado: cotizacionAnterior.estado },
      { estado: cotizacion.estado },
      idUsuario,
      direccionIP,
      navegador,
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

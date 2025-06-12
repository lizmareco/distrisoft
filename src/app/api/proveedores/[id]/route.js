import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
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

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    console.log(`API: Obteniendo proveedor con ID: ${id}`)

    const proveedor = await prisma.proveedor.findUnique({
      where: {
        idProveedor: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        empresa: {
          include: {
            tipoDocumento: true,
            ciudad: true,
            categoriaEmpresa: true,
          },
        },
      },
    })

    if (!proveedor) {
      console.log(`API: Proveedor con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    console.log(`API: Proveedor con ID ${id} encontrado`)
    return NextResponse.json(proveedor, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener proveedor:", error)
    return NextResponse.json(
      { error: "Error al obtener proveedor", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)


    const resolvedParams = await params 
    const { id } = resolvedParams
    const data = await request.json()
    console.log(`API: Actualizando proveedor con ID: ${id}`)
    console.log("Datos recibidos:", data)

    // Obtener el proveedor actual para auditoría
    const proveedorAnterior = await prisma.proveedor.findUnique({
      where: { idProveedor: Number.parseInt(id) },
      include: {
        empresa: true,
      },
    })

    if (!proveedorAnterior) {
      console.log(`API: Proveedor con ID ${id} no encontrado para actualizar`)
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Actualizar el proveedor incluyendo el campo comentario
    const proveedor = await prisma.proveedor.update({
      where: {
        idProveedor: Number.parseInt(id),
      },
      data: {
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : undefined,
        comentario: data.comentario !== undefined ? data.comentario : undefined,
        updatedAt: new Date(),
      },
      include: {
        empresa: {
          include: {
            tipoDocumento: true,
            ciudad: true,
            categoriaEmpresa: true,
          },
        },
      },
    })

    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "Proveedor",
      Number.parseInt(id),
      proveedorAnterior,
      proveedor,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Proveedor con ID ${id} actualizado correctamente`)
    return NextResponse.json(proveedor, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al actualizar proveedor:", error)
    return NextResponse.json(
      { error: "Error al actualizar proveedor", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const auditoriaService = new AuditoriaService()
    const authController = new AuthController()
    const idUsuario = await getUserIdFromRequest(request)


    const resolvedParams = await params 
    const { id } = resolvedParams
    console.log(`API: Eliminando proveedor con ID: ${id}`)

    // Obtener el proveedor actual para auditoría
    const proveedorAnterior = await prisma.proveedor.findUnique({
      where: { idProveedor: Number.parseInt(id) },
      include: {
        empresa: true,
      },
    })

    if (!proveedorAnterior) {
      console.log(`API: Proveedor con ID ${id} no encontrado para eliminar`)
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Eliminar el proveedor (soft delete)
    await prisma.proveedor.update({
      where: {
        idProveedor: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion(
      "Proveedor",
      Number.parseInt(id),
      proveedorAnterior,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`API: Proveedor con ID ${id} eliminado correctamente`)
    return NextResponse.json({ message: "Proveedor eliminado correctamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al eliminar proveedor:", error)
    return NextResponse.json(
      { error: "Error al eliminar proveedor", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

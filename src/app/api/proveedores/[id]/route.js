import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request, { params }) {
  try {
    const { id } = params
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
            persona: true,
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
    const authController = new AuthController()

    // Obtener el usuario actual desde el token (si está autenticado)
    const accessToken = await authController.hasAccessToken(request)
    let idUsuario = null

    if (accessToken) {
      const userData = await authController.getUserFromToken(accessToken)
      idUsuario = userData?.idUsuario || null
    }

    // Si no hay usuario autenticado, usar un ID por defecto para desarrollo
    if (!idUsuario) {
      idUsuario = 1
    }

    const { id } = params
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
        comentario: data.comentario !== undefined ? data.comentario : undefined, // Actualizar comentario si se proporciona
        updatedAt: new Date(),
      },
      include: {
        empresa: {
          include: {
            tipoDocumento: true,
            persona: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Proveedor",
      idRegistro: id.toString(),
      accion: "ACTUALIZAR",
      valorAnterior: proveedorAnterior,
      valorNuevo: proveedor,
      idUsuario: idUsuario,
      request: request,
    })

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

    // Obtener el usuario actual desde el token (si está autenticado)
    const accessToken = await authController.hasAccessToken(request)
    let idUsuario = null

    if (accessToken) {
      const userData = await authController.getUserFromToken(accessToken)
      idUsuario = userData?.idUsuario || null
    }

    // Si no hay usuario autenticado, usar un ID por defecto para desarrollo
    if (!idUsuario) {
      idUsuario = 1
    }

    const { id } = params
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

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Proveedor",
      idRegistro: id.toString(),
      accion: "ELIMINAR",
      valorAnterior: proveedorAnterior,
      valorNuevo: null,
      idUsuario: idUsuario,
      request: request,
    })

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

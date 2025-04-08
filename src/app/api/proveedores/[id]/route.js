import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"

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
        empresa: true,
        condicionPago: true,
      },
    })

    if (!proveedor) {
      console.log(`API: Proveedor con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    console.log(`API: Proveedor con ID ${id} encontrado`)
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("API: Error al obtener proveedor:", error)
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params
    const data = await request.json()
    console.log(`API: Actualizando proveedor con ID: ${id}`)
    console.log("Datos recibidos:", data)

    // Obtener el proveedor actual para auditoría
    const proveedorAnterior = await prisma.proveedor.findUnique({
      where: { idProveedor: Number.parseInt(id) },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    if (!proveedorAnterior) {
      console.log(`API: Proveedor con ID ${id} no encontrado para actualizar`)
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    // Actualizar el proveedor
    const proveedor = await prisma.proveedor.update({
      where: {
        idProveedor: Number.parseInt(id),
      },
      data: {
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : undefined,
        idCondicionPago: data.idCondicionPago ? Number.parseInt(data.idCondicionPago) : undefined,
        updatedAt: new Date(),
      },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "Proveedor",
      id,
      proveedorAnterior,
      proveedor,
      userData.idUsuario,
      request,
    )

    console.log(`API: Proveedor con ID ${id} actualizado correctamente`)
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("API: Error al actualizar proveedor:", error)
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params
    console.log(`API: Eliminando proveedor con ID: ${id}`)

    // Obtener el proveedor actual para auditoría
    const proveedorAnterior = await prisma.proveedor.findUnique({
      where: { idProveedor: Number.parseInt(id) },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    if (!proveedorAnterior) {
      console.log(`API: Proveedor con ID ${id} no encontrado para eliminar`)
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
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
    await auditoriaService.registrarEliminacion("Proveedor", id, proveedorAnterior, userData.idUsuario, request)

    console.log(`API: Proveedor con ID ${id} eliminado correctamente`)
    return NextResponse.json({ message: "Proveedor eliminado correctamente" })
  } catch (error) {
    console.error("API: Error al eliminar proveedor:", error)
    return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 })
  }
}


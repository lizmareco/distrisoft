import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET(request, { params }) {
  try {
    console.log(`Obteniendo cliente con ID: ${params.id}...`)

    const { id } = params

    const cliente = await prisma.cliente.findUnique({
      where: {
        idCliente: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    console.log(`Cliente encontrado con ID: ${id}`)
    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al obtener cliente:", error)
    return NextResponse.json({ error: "Error al obtener cliente: " + error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    console.log(`Actualizando cliente con ID: ${params.id}...`)
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params
    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Obtener el cliente actual para auditoría
    const clienteAnterior = await prisma.cliente.findUnique({
      where: { idCliente: Number.parseInt(id) },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    if (!clienteAnterior) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Actualizar el cliente
    const cliente = await prisma.cliente.update({
      where: {
        idCliente: Number.parseInt(id),
      },
      data: {
        idPersona: data.idPersona ? Number.parseInt(data.idPersona) : undefined,
        idSectorCliente: data.idSectorCliente ? Number.parseInt(data.idSectorCliente) : undefined,
        idCondicionPago: data.idCondicionPago ? Number.parseInt(data.idCondicionPago) : undefined,
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : null,
        updatedAt: new Date(),
      },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion("Cliente", id, clienteAnterior, cliente, userData.idUsuario, request)

    console.log(`Cliente actualizado con ID: ${id}`)
    return NextResponse.json(cliente)
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return NextResponse.json({ error: "Error al actualizar cliente: " + error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log(`Eliminando cliente con ID: ${params.id}...`)
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const { id } = params

    // Obtener el cliente actual para auditoría
    const clienteAnterior = await prisma.cliente.findUnique({
      where: { idCliente: Number.parseInt(id) },
      include: {
        persona: true,
        sectorCliente: true,
        condicionPago: true,
        empresa: true,
      },
    })

    if (!clienteAnterior) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Eliminar el cliente (soft delete)
    await prisma.cliente.update({
      where: {
        idCliente: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Cliente", id, clienteAnterior, userData.idUsuario, request)

    console.log(`Cliente eliminado con ID: ${id}`)
    return NextResponse.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return NextResponse.json({ error: "Error al eliminar cliente: " + error.message }, { status: 500 })
  }
}


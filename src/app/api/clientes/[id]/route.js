import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"

async function getUserIdFromRequest(request, authController) {
  let token = null
  if (request.cookies && typeof request.cookies.get === "function") {
    token = request.cookies.get("at")?.value
  }
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }
  if (!token) return 1 // O null
  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

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
    const authController = new AuthController()
    const idUsuario = await getUserIdFromRequest(request, authController)


    const { id } = params
    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Obtener el cliente actual para auditoría
    const clienteAnterior = await prisma.cliente.findUnique({
      where: { idCliente: Number.parseInt(id) },
      include: {
        persona: true,
        sectorCliente: true,
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
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : null,
        updatedAt: new Date(),
      },
      include: {
        persona: true,
        sectorCliente: true,
        empresa: true,
      },
    })

    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "Cliente",
      Number.parseInt(id),
      clienteAnterior,
      cliente,
      idUsuario,
      direccionIP,
      navegador,
    )

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
    const authController = new AuthController()
    const idUsuario = await getUserIdFromRequest(request, authController)

    const { id } = params
    // Obtener el cliente actual para auditoría
    const clienteAnterior = await prisma.cliente.findUnique({
      where: { idCliente: Number.parseInt(id) },
      include: {
        persona: true,
        sectorCliente: true,
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

    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion(
      "Cliente",
      Number.parseInt(id),
      clienteAnterior,
      idUsuario,
      direccionIP,
      navegador,
    )

    console.log(`Cliente eliminado con ID: ${id}`)
    return NextResponse.json({ message: "Cliente eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return NextResponse.json({ error: "Error al eliminar cliente: " + error.message }, { status: 500 })
  }
}

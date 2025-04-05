import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET() {
  try {
    console.log("API: Obteniendo proveedores...")
    const proveedores = await prisma.proveedor.findMany({
      include: {
        empresa: true,
        condicionPago: true,
      },
      where: {
        deletedAt: null,
      },
    })
    console.log(`API: Se encontraron ${proveedores.length} proveedores`)

    return NextResponse.json(proveedores)
  } catch (error) {
    console.error("API: Error al obtener proveedores:", error)
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("API: Creando nuevo proveedor...")
    const auditoriaService = new AuditoriaService()

    // Usar exactamente el mismo ID de usuario que en clientes
    const userData = { idUsuario: 1 }

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idEmpresa || !data.idCondicionPago) {
      console.error("API: Datos incompletos:", data)
      return NextResponse.json({ error: "Faltan datos requeridos (empresa o condición de pago)" }, { status: 400 })
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        idEmpresa: Number.parseInt(data.idEmpresa),
        idCondicionPago: Number.parseInt(data.idCondicionPago),
      },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    // Registrar la acción en auditoría - EXACTAMENTE IGUAL QUE EN CLIENTES
    await auditoriaService.registrarCreacion("Proveedor", proveedor.idProveedor, proveedor, userData.idUsuario, request)

    console.log("API: Proveedor creado con ID:", proveedor.idProveedor)
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("API: Error al crear proveedor:", error)
    return NextResponse.json({ error: `Error al crear proveedor: ${error.message}` }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    console.log("API: Actualizando proveedor...")
    const auditoriaService = new AuditoriaService()

    // Usar exactamente el mismo ID de usuario que en clientes
    const userData = { idUsuario: 1 }

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar ID del proveedor
    if (!data.idProveedor) {
      console.error("API: Falta ID del proveedor:", data)
      return NextResponse.json({ error: "Falta ID del proveedor" }, { status: 400 })
    }

    // Obtener el proveedor actual para auditoría
    const proveedorAnterior = await prisma.proveedor.findUnique({
      where: { idProveedor: Number.parseInt(data.idProveedor) },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    if (!proveedorAnterior) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    // Actualizar el proveedor
    const proveedor = await prisma.proveedor.update({
      where: { idProveedor: Number.parseInt(data.idProveedor) },
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

    // Registrar la acción en auditoría - EXACTAMENTE IGUAL QUE EN CLIENTES
    await auditoriaService.registrarActualizacion(
      "Proveedor",
      proveedor.idProveedor,
      proveedorAnterior,
      proveedor,
      userData.idUsuario,
      request,
    )

    console.log("API: Proveedor actualizado con ID:", proveedor.idProveedor)
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("API: Error al actualizar proveedor:", error)
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    console.log("API: Eliminando proveedor...")
    const auditoriaService = new AuditoriaService()

    // Usar exactamente el mismo ID de usuario que en clientes
    const userData = { idUsuario: 1 }

    // Obtener ID del proveedor
    const { searchParams } = new URL(request.url)
    const idProveedor = searchParams.get("id")

    if (!idProveedor) {
      console.error("API: Falta ID del proveedor")
      return NextResponse.json({ error: "Falta ID del proveedor" }, { status: 400 })
    }

    // Obtener el proveedor actual para auditoría
    const proveedorAnterior = await prisma.proveedor.findUnique({
      where: { idProveedor: Number.parseInt(idProveedor) },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    if (!proveedorAnterior) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    // Eliminar el proveedor (soft delete)
    await prisma.proveedor.update({
      where: { idProveedor: Number.parseInt(idProveedor) },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría - EXACTAMENTE IGUAL QUE EN CLIENTES
    await auditoriaService.registrarEliminacion(
      "Proveedor",
      idProveedor,
      proveedorAnterior,
      userData.idUsuario,
      request,
    )

    console.log("API: Proveedor eliminado con ID:", idProveedor)
    return NextResponse.json({ message: "Proveedor eliminado exitosamente" })
  } catch (error) {
    console.error("API: Error al eliminar proveedor:", error)
    return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 })
  }
}


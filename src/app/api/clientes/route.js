import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { testAuditoria } from "./test-audit"

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

    // Devolver directamente el array de proveedores, no un objeto con propiedad 'proveedores'
    return NextResponse.json(proveedores)
  } catch (error) {
    console.error("API: Error al obtener proveedores:", error)
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log("API: Creando nuevo proveedor...")

    // Primero, intentar el test de auditoría
    try {
      const testResult = await testAuditoria()
      console.log("Test de auditoría completado:", testResult ? "Éxito" : "Fallo")
    } catch (testError) {
      console.error("Error en test de auditoría:", testError)
    }

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

    console.log("Proveedor creado:", proveedor)

    // Registrar la acción en auditoría directamente
    try {
      const auditoria = await prisma.auditoria.create({
        data: {
          entidad: "Proveedor",
          idRegistro: String(proveedor.idProveedor),
          accion: "CREAR",
          valorAnterior: null,
          valorNuevo: JSON.stringify({
            idProveedor: proveedor.idProveedor,
            idEmpresa: proveedor.idEmpresa,
            idCondicionPago: proveedor.idCondicionPago,
          }),
          idUsuario: 0, // Usuario por defecto
          direccionIP: "127.0.0.1",
          navegador: "API Direct",
          fechaCreacion: new Date(),
        },
      })

      console.log("Auditoría registrada directamente:", auditoria.idAuditoria)
    } catch (auditError) {
      console.error("Error al registrar auditoría directamente:", auditError)
    }

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("API: Error al crear proveedor:", error)
    return NextResponse.json({ error: `Error al crear proveedor: ${error.message}` }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    console.log("API: Actualizando proveedor...")

    // Obtener datos del proveedor
    const { idProveedor, ...proveedorData } = await request.json()

    if (!idProveedor) {
      return NextResponse.json({ error: "ID de proveedor requerido" }, { status: 400 })
    }

    console.log("Actualizando proveedor ID:", idProveedor)
    console.log("Datos de actualización:", proveedorData)

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

    // Actualizar el proveedor
    const proveedorActualizado = await prisma.proveedor.update({
      where: { idProveedor: Number.parseInt(idProveedor) },
      data: {
        idEmpresa: proveedorData.idEmpresa ? Number.parseInt(proveedorData.idEmpresa) : undefined,
        idCondicionPago: proveedorData.idCondicionPago ? Number.parseInt(proveedorData.idCondicionPago) : undefined,
        updatedAt: new Date(),
      },
      include: {
        empresa: true,
        condicionPago: true,
      },
    })

    // Registrar la acción en auditoría directamente
    try {
      const auditoria = await prisma.auditoria.create({
        data: {
          entidad: "Proveedor",
          idRegistro: String(idProveedor),
          accion: "ACTUALIZAR",
          valorAnterior: JSON.stringify({
            idProveedor: proveedorAnterior.idProveedor,
            idEmpresa: proveedorAnterior.idEmpresa,
            idCondicionPago: proveedorAnterior.idCondicionPago,
          }),
          valorNuevo: JSON.stringify({
            idProveedor: proveedorActualizado.idProveedor,
            idEmpresa: proveedorActualizado.idEmpresa,
            idCondicionPago: proveedorActualizado.idCondicionPago,
          }),
          idUsuario: 0, // Usuario por defecto
          direccionIP: "127.0.0.1",
          navegador: "API Direct",
          fechaCreacion: new Date(),
        },
      })

      console.log("Auditoría de actualización registrada directamente:", auditoria.idAuditoria)
    } catch (auditError) {
      console.error("Error al registrar auditoría de actualización directamente:", auditError)
    }

    return NextResponse.json(proveedorActualizado)
  } catch (error) {
    console.error("API: Error al actualizar proveedor:", error)
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    console.log("API: Eliminando proveedor...")

    // Obtener ID del proveedor
    const { searchParams } = new URL(request.url)
    const idProveedor = searchParams.get("id")

    if (!idProveedor) {
      return NextResponse.json({ error: "ID de proveedor requerido" }, { status: 400 })
    }

    console.log("Eliminando proveedor ID:", idProveedor)

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

    // Registrar la acción en auditoría directamente
    try {
      const auditoria = await prisma.auditoria.create({
        data: {
          entidad: "Proveedor",
          idRegistro: String(idProveedor),
          accion: "ELIMINAR",
          valorAnterior: JSON.stringify({
            idProveedor: proveedorAnterior.idProveedor,
            idEmpresa: proveedorAnterior.idEmpresa,
            idCondicionPago: proveedorAnterior.idCondicionPago,
          }),
          valorNuevo: null,
          idUsuario: 0, // Usuario por defecto
          direccionIP: "127.0.0.1",
          navegador: "API Direct",
          fechaCreacion: new Date(),
        },
      })

      console.log("Auditoría de eliminación registrada directamente:", auditoria.idAuditoria)
    } catch (auditError) {
      console.error("Error al registrar auditoría de eliminación directamente:", auditError)
    }

    return NextResponse.json({ message: "Proveedor eliminado correctamente" })
  } catch (error) {
    console.error("API: Error al eliminar proveedor:", error)
    return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@/settings"

const prisma = new PrismaClient()

// Función para verificar JWT basada en tu implementación actual
async function verifyJWT(token) {
  if (!token) {
    throw new Error("Token no proporcionado")
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado en las variables de entorno")
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, JWT_SECRET)

    // Verificar si el token existe en la base de datos y es válido
    const tokenRecord = await prisma.accessToken.findFirst({
      where: {
        accessToken: token,
        deletedAt: null,
      },
    })

    if (!tokenRecord && process.env.NODE_ENV !== "development") {
      throw new Error("Token no encontrado en base de datos")
    }

    return decoded
  } catch (error) {
    console.error("Error al verificar JWT:", error.message)
    throw new Error("Token inválido o expirado")
  }
}

// GET: Obtener un registro de inventario por ID
export async function GET(request, { params }) {
  try {
    const { id } = params

    // Verificar autenticación
    const token = request.headers.get("authorization")?.split(" ")[1] || ""
    try {
      await verifyJWT(token)
    } catch (error) {
      console.error("Error de autenticación:", error)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log(`API Inventario - Buscando registro con ID: ${id}`)

    // Buscar el registro de inventario
    const inventario = await prisma.inventario.findUnique({
      where: {
        idInventario: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        materiaPrima: {
          select: {
            idMateriaPrima: true,
            nombreMateriaPrima: true,
            descMateriaPrima: true,
          },
        },
        ordenCompra: {
          select: {
            idOrdenCompra: true,
          },
        },
      },
    })

    if (!inventario) {
      return NextResponse.json({ error: "Registro de inventario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(inventario)
  } catch (error) {
    console.error(`Error al obtener registro de inventario: ${error.message}`)
    return NextResponse.json(
      { error: "Error al obtener registro de inventario", details: error.message },
      { status: 500 },
    )
  }
}

// PUT: Actualizar un registro de inventario
export async function PUT(request, { params }) {
  try {
    const { id } = params

    // Verificar autenticación
    const token = request.headers.get("authorization")?.split(" ")[1] || ""
    let userId
    try {
      const decoded = await verifyJWT(token)
      userId = decoded.idUsuario
    } catch (error) {
      console.error("Error de autenticación:", error)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    console.log(`API Inventario - Actualizando registro ID: ${id}`, data)

    // Verificar que el registro existe
    const inventarioExistente = await prisma.inventario.findUnique({
      where: {
        idInventario: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!inventarioExistente) {
      return NextResponse.json({ error: "Registro de inventario no encontrado" }, { status: 404 })
    }

    // Verificar materia prima si se va a actualizar
    if (data.idMateriaPrima) {
      const materiaPrima = await prisma.materiaPrima.findUnique({
        where: { idMateriaPrima: data.idMateriaPrima, deletedAt: null },
      })

      if (!materiaPrima) {
        return NextResponse.json({ error: "La materia prima especificada no existe" }, { status: 404 })
      }
    }

    // Verificar orden de compra si se va a actualizar
    if (data.idOrdenCompra) {
      const ordenCompra = await prisma.ordenCompra.findUnique({
        where: { idOrdenCompra: data.idOrdenCompra, deletedAt: null },
      })

      if (!ordenCompra) {
        return NextResponse.json({ error: "La orden de compra especificada no existe" }, { status: 404 })
      }
    }

    // Actualizar registro
    const inventarioActualizado = await prisma.inventario.update({
      where: {
        idInventario: Number.parseInt(id),
      },
      data: {
        idMateriaPrima: data.idMateriaPrima !== undefined ? data.idMateriaPrima : undefined,
        cantidad: data.cantidad !== undefined ? data.cantidad : undefined,
        unidadMedida: data.unidadMedida || undefined,
        fechaIngreso: data.fechaIngreso || undefined,
        idOrdenCompra: data.idOrdenCompra !== undefined ? data.idOrdenCompra : undefined,
        observacion: data.observacion !== undefined ? data.observacion : undefined,
        updatedAt: new Date(),
      },
    })

    // Registrar en auditoría
    try {
      await prisma.auditoria.create({
        data: {
          idUsuario: userId,
          accion: "ACTUALIZAR",
          tabla: "Inventario",
          descripcion: `Actualización de registro de inventario ID: ${id}`,
          valorAnterior: JSON.stringify(inventarioExistente),
          valorNuevo: JSON.stringify(inventarioActualizado),
        },
      })
    } catch (errorAuditoria) {
      console.error("Error al registrar auditoría:", errorAuditoria)
      // No interrumpimos el flujo por un error en auditoría
    }

    return NextResponse.json(inventarioActualizado)
  } catch (error) {
    console.error(`Error al actualizar registro de inventario: ${error.message}`)
    return NextResponse.json(
      { error: "Error al actualizar registro de inventario", details: error.message },
      { status: 500 },
    )
  }
}

// DELETE: Eliminar lógicamente un registro de inventario
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Verificar autenticación
    const token = request.headers.get("authorization")?.split(" ")[1] || ""
    let userId
    try {
      const decoded = await verifyJWT(token)
      userId = decoded.idUsuario
    } catch (error) {
      console.error("Error de autenticación:", error)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log(`API Inventario - Eliminando registro ID: ${id}`)

    // Verificar que el registro existe
    const inventarioExistente = await prisma.inventario.findUnique({
      where: {
        idInventario: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!inventarioExistente) {
      return NextResponse.json({ error: "Registro de inventario no encontrado" }, { status: 404 })
    }

    // Eliminar lógicamente el registro
    const inventarioEliminado = await prisma.inventario.update({
      where: {
        idInventario: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar en auditoría
    try {
      await prisma.auditoria.create({
        data: {
          idUsuario: userId,
          accion: "ELIMINAR",
          tabla: "Inventario",
          descripcion: `Eliminación lógica de registro de inventario ID: ${id}`,
          valorAnterior: JSON.stringify(inventarioExistente),
          valorNuevo: JSON.stringify(inventarioEliminado),
        },
      })
    } catch (errorAuditoria) {
      console.error("Error al registrar auditoría:", errorAuditoria)
      // No interrumpimos el flujo por un error en auditoría
    }

    return NextResponse.json({ message: "Registro eliminado correctamente" })
  } catch (error) {
    console.error(`Error al eliminar registro de inventario: ${error.message}`)
    return NextResponse.json(
      { error: "Error al eliminar registro de inventario", details: error.message },
      { status: 500 },
    )
  }
}

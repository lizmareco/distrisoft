import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener un producto por ID
export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Obteniendo producto con ID: ${id}`)

    if (isNaN(id)) {
      console.log(`API: ID de producto inválido: ${params.id}`)
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const producto = await prisma.producto.findUnique({
      where: {
        idProducto: id,
        deletedAt: null, // Asegurar que solo se obtengan productos no eliminados
      },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    if (!producto) {
      console.log(`API: Producto con ID ${id} no encontrado`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Formatear el producto para tener la estructura esperada por el frontend
    const productoFormateado = {
      ...producto,
      unidadMedida: producto.unidadMedida
        ? {
            idUnidadMedida: producto.unidadMedida.idUnidadMedida,
            descUnidadMedida: producto.unidadMedida.descUnidadMedida,
            abreviatura: producto.unidadMedida.abreviatura,
          }
        : null,
      estadoProducto: producto.estadoProducto
        ? {
            idEstadoProducto: producto.estadoProducto.idEstadoProducto,
            nombreEstadoProducto: producto.estadoProducto.descEstadoProducto, // Mapear descEstadoProducto a nombreEstadoProducto
          }
        : null,
      tipoProducto: producto.tipoProducto
        ? {
            idTipoProducto: producto.tipoProducto.idTipoProducto,
            nombreTipoProducto: producto.tipoProducto.descTipoProducto, // Mapear descTipoProducto a nombreTipoProducto
          }
        : null,
    }

    console.log(`API: Producto con ID ${id} encontrado`)
    return NextResponse.json(productoFormateado)
  } catch (error) {
    console.error("API: Error al obtener producto:", error)
    return NextResponse.json({ error: "Error al obtener producto: " + error.message }, { status: 500 })
  }
}

// PUT - Actualizar un producto
export async function PUT(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Actualizando producto con ID: ${id}`)
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Obtener el producto actual para auditoría
    const productoAnterior = await prisma.producto.findUnique({
      where: { idProducto: id },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    if (!productoAnterior) {
      console.log(`API: Producto con ID ${id} no encontrado para actualizar`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Verificar si ya existe otro producto con el mismo nombre
    const productoExistente = await prisma.producto.findFirst({
      where: {
        nombreProducto: {
          equals: data.nombreProducto,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        idProducto: {
          not: id,
        },
        deletedAt: null,
      },
    })

    if (productoExistente) {
      console.log(`API: Ya existe otro producto con el nombre "${data.nombreProducto}"`)
      return NextResponse.json({ error: "Ya existe otro producto con este nombre" }, { status: 400 })
    }

    // Convertir los valores a números
    const productoActualizado = await prisma.producto.update({
      where: {
        idProducto: id,
      },
      data: {
        nombreProducto: data.nombreProducto,
        descripcion: data.descripcion,
        idTipoProducto: Number.parseInt(data.idTipoProducto),
        pesoUnidad: Number.parseFloat(data.pesoUnidad),
        precioUnitario: Number.parseFloat(data.precioUnitario),
        idEstadoProducto: Number.parseInt(data.idEstadoProducto),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        updatedAt: new Date(),
      },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "Producto",
      id,
      productoAnterior,
      productoActualizado,
      userData.idUsuario,
      request,
    )

    console.log(`API: Producto con ID ${id} actualizado correctamente`)
    return NextResponse.json(productoActualizado)
  } catch (error) {
    console.error("API: Error al actualizar producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto: " + error.message }, { status: 500 })
  }
}

// DELETE - Eliminar un producto (soft delete)
export async function DELETE(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    console.log(`API: Eliminando producto con ID: ${id}`)
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    // Obtener el producto actual para auditoría
    const productoAnterior = await prisma.producto.findUnique({
      where: { idProducto: id },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    if (!productoAnterior) {
      console.log(`API: Producto con ID ${id} no encontrado para eliminar`)
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Realizar soft delete
    await prisma.producto.update({
      where: {
        idProducto: id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Producto", id, productoAnterior, userData.idUsuario, request)

    console.log(`API: Producto con ID ${id} eliminado correctamente`)
    return NextResponse.json({ message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("API: Error al eliminar producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto: " + error.message }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET - Obtener un producto por ID
export async function GET(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de producto inválido" }, { status: 400 })
    }

    const producto = await prisma.producto.findUnique({
      where: {
        idProducto: id,
      },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    if (!producto || producto.deletedAt !== null) {
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

    return NextResponse.json(productoFormateado)
  } catch (error) {
    console.error("Error al obtener producto:", error)
    return NextResponse.json({ error: "Error al obtener producto: " + error.message }, { status: 500 })
  }
}

// PUT - Actualizar un producto
export async function PUT(request, { params }) {
  try {
    const id = Number.parseInt(params.id)
    const data = await request.json()

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
    })

    return NextResponse.json(productoActualizado)
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return NextResponse.json({ error: "Error al actualizar producto: " + error.message }, { status: 500 })
  }
}

// DELETE - Eliminar un producto (soft delete)
export async function DELETE(request, { params }) {
  try {
    const id = Number.parseInt(params.id)

    await prisma.producto.update({
      where: {
        idProducto: id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Producto eliminado correctamente" })
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    return NextResponse.json({ error: "Error al eliminar producto: " + error.message }, { status: 500 })
  }
}


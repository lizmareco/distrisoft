import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    // Mapear los resultados para tener la estructura esperada por el frontend
    const productosFormateados = productos.map((producto) => ({
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
    }))

    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return NextResponse.json({ error: "Error al obtener productos: " + error.message }, { status: 500 })
  }
}

// POST - Crear un nuevo producto
export async function POST(request) {
  try {
    const data = await request.json()

    // Verificar si ya existe un producto con el mismo nombre
    const productoExistente = await prisma.producto.findFirst({
      where: {
        nombreProducto: {
          equals: data.nombreProducto,
          mode: "insensitive", // Ignorar mayúsculas/minúsculas
        },
        deletedAt: null,
      },
    })

    if (productoExistente) {
      return NextResponse.json({ error: "Ya existe un producto con este nombre" }, { status: 400 })
    }

    // Convertir los valores a números
    const nuevoProducto = await prisma.producto.create({
      data: {
        nombreProducto: data.nombreProducto,
        descripcion: data.descripcion,
        idTipoProducto: Number.parseInt(data.idTipoProducto),
        pesoUnidad: Number.parseFloat(data.pesoUnidad),
        precioUnitario: Number.parseFloat(data.precioUnitario),
        idEstadoProducto: Number.parseInt(data.idEstadoProducto),
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        createdAt: new Date(),
      },
    })

    return NextResponse.json(nuevoProducto, { status: 201 })
  } catch (error) {
    console.error("Error al crear producto:", error)
    return NextResponse.json({ error: "Error al crear producto: " + error.message }, { status: 500 })
  }
}


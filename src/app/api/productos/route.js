import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client" // Asegúrate de que esta importación sea correcta
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener todos los productos
export async function GET() {
  try {
    console.log("API: Obteniendo productos...")

    const productos = await prisma.producto.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
      orderBy: {
        nombreProducto: "asc",
      },
    })

    console.log(`API: Se encontraron ${productos.length} productos`)
    return NextResponse.json(productos)
  } catch (error) {
    console.error("API: Error al obtener productos:", error)
    return NextResponse.json(
      { message: "Error al obtener productos", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear un nuevo producto
export async function POST(request) {
  try {
    console.log("API: Creando nuevo producto...")
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // En desarrollo, podemos usar un usuario ficticio
    let userData = { idUsuario: 1 }

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userFromToken = await authController.getUserFromToken(accessToken)
      if (userFromToken) {
        userData = userFromToken
      }
    }

    // Obtener datos del producto
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

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
      console.log(`API: Ya existe un producto con el nombre "${data.nombreProducto}"`)
      return NextResponse.json(
        { message: "Ya existe un producto con este nombre" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Crear el producto
    const producto = await prisma.producto.create({
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
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Producto", producto.idProducto, producto, userData.idUsuario, request)

    console.log(`API: Producto creado con ID: ${producto.idProducto}`)
    return NextResponse.json(
      { message: "Producto creado exitosamente", producto },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear producto:", error)
    return NextResponse.json(
      { message: "Error al crear producto", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// PUT - Actualizar un producto
export async function PUT(request) {
  try {
    console.log("API: Actualizando producto...")
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // En desarrollo, podemos usar un usuario ficticio
    let userData = { idUsuario: 1 }

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userFromToken = await authController.getUserFromToken(accessToken)
      if (userFromToken) {
        userData = userFromToken
      }
    }

    // Obtener datos del producto
    const { idProducto, ...productoData } = await request.json()
    console.log(`API: Actualizando producto con ID: ${idProducto}`)
    console.log("API: Datos recibidos:", productoData)

    if (!idProducto) {
      console.log("API: Falta ID del producto")
      return NextResponse.json({ message: "ID de producto requerido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Obtener el producto actual para auditoría
    const productoAnterior = await prisma.producto.findUnique({
      where: { idProducto: Number.parseInt(idProducto) },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    if (!productoAnterior) {
      console.log(`API: Producto con ID ${idProducto} no encontrado para actualizar`)
      return NextResponse.json({ message: "Producto no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si ya existe otro producto con el mismo nombre
    if (productoData.nombreProducto) {
      const productoExistente = await prisma.producto.findFirst({
        where: {
          nombreProducto: {
            equals: productoData.nombreProducto,
            mode: "insensitive", // Ignorar mayúsculas/minúsculas
          },
          idProducto: {
            not: Number.parseInt(idProducto),
          },
          deletedAt: null,
        },
      })

      if (productoExistente) {
        console.log(`API: Ya existe otro producto con el nombre "${productoData.nombreProducto}"`)
        return NextResponse.json(
          { message: "Ya existe otro producto con este nombre" },
          { status: HTTP_STATUS_CODES.badRequest },
        )
      }
    }

    // Actualizar el producto
    const productoActualizado = await prisma.producto.update({
      where: { idProducto: Number.parseInt(idProducto) },
      data: {
        ...productoData,
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
      idProducto,
      productoAnterior,
      productoActualizado,
      userData.idUsuario,
      request,
    )

    console.log(`API: Producto con ID ${idProducto} actualizado correctamente`)
    return NextResponse.json(
      { message: "Producto actualizado exitosamente", producto: productoActualizado },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al actualizar producto:", error)
    return NextResponse.json(
      { message: "Error al actualizar producto", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// DELETE - Eliminar un producto (soft delete)
export async function DELETE(request) {
  try {
    console.log("API: Eliminando producto...")
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // En desarrollo, podemos usar un usuario ficticio
    let userData = { idUsuario: 1 }

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userFromToken = await authController.getUserFromToken(accessToken)
      if (userFromToken) {
        userData = userFromToken
      }
    }

    // Obtener ID del producto
    const { searchParams } = new URL(request.url)
    const idProducto = searchParams.get("id")
    console.log(`API: Eliminando producto con ID: ${idProducto}`)

    if (!idProducto) {
      console.log("API: Falta ID del producto")
      return NextResponse.json({ message: "ID de producto requerido" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Obtener el producto actual para auditoría
    const productoAnterior = await prisma.producto.findUnique({
      where: { idProducto: Number.parseInt(idProducto) },
      include: {
        unidadMedida: true,
        estadoProducto: true,
        tipoProducto: true,
      },
    })

    if (!productoAnterior) {
      console.log(`API: Producto con ID ${idProducto} no encontrado para eliminar`)
      return NextResponse.json({ message: "Producto no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Realizar soft delete en lugar de eliminación permanente
    await prisma.producto.update({
      where: { idProducto: Number.parseInt(idProducto) },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Producto", idProducto, productoAnterior, userData.idUsuario, request)

    console.log(`API: Producto con ID ${idProducto} eliminado correctamente`)
    return NextResponse.json({ message: "Producto eliminado exitosamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al eliminar producto:", error)
    return NextResponse.json(
      { message: "Error al eliminar producto", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}


import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener todos los productos (activos e inactivos)
export async function GET(request) {
  try {
    console.log("API: Obteniendo productos...")

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    console.log(`API: Incluir inactivos: ${includeInactive}`)

    // Construir la consulta
    const whereClause = {
      // Siempre excluir productos eliminados (con deletedAt)
      deletedAt: null,
    }

    // Si no se incluyen inactivos, filtrar por estado activo (idEstadoProducto = 1)
    if (!includeInactive) {
      whereClause.idEstadoProducto = 1 // Asumiendo que 1 es el ID del estado "Activo"
    }

    const productos = await prisma.producto.findMany({
      where: whereClause,
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
      },
      orderBy: {
        nombreProducto: "asc",
      },
    })

    // Mapear los productos para asegurar que tipoProducto tenga nombreTipoProducto
    const productosFormateados = productos.map((producto) => {
      // Crear una copia del producto
      const productoFormateado = { ...producto }

      // Si tiene tipoProducto, asegurarse de que tenga nombreTipoProducto
      if (productoFormateado.tipoProducto) {
        productoFormateado.tipoProducto = {
          ...productoFormateado.tipoProducto,
          nombreTipoProducto: productoFormateado.tipoProducto.descTipoProducto,
        }
      }

      return productoFormateado
    })

    console.log(`API: Se encontraron ${productosFormateados.length} productos`)
    // Agregar log para depuración
    if (productosFormateados.length > 0) {
      console.log("API: Ejemplo de producto formateado:", {
        id: productosFormateados[0].idProducto,
        nombre: productosFormateados[0].nombreProducto,
        tipoProducto: productosFormateados[0].tipoProducto,
      })
    }

    return NextResponse.json(productosFormateados)
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
        idUnidadMedida: Number.parseInt(data.idUnidadMedida),
        idEstadoProducto: Number.parseInt(data.idEstadoProducto) || 1, // Por defecto, estado activo (1)
        createdAt: new Date(),
      },
      include: {
        unidadMedida: true,
        tipoProducto: true,
        estadoProducto: true,
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

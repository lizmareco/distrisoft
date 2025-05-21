import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"


const prisma = new PrismaClient()

// Función para verificar si estamos en modo desarrollo
const isDevelopment = process.env.NODE_ENV === "development"

/**
 * Obtiene el stock de todos los productos o filtra por nombre
 * @param {Request} request - La solicitud HTTP
 * @returns {Promise<NextResponse>} - Respuesta con los productos y su stock
 */
export async function GET(request) {
  try {
    // Verificar autenticación en producción
    if (!isDevelopment) {
      const token = request.headers.get("authorization")?.split(" ")[1]
      if (!token) {
        return NextResponse.json({ error: "Token no proporcionado" }, { status: 401 })
      }

      const tokenValido = await AuthController(token)
      if (!tokenValido) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
      }
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const nombre = searchParams.get("nombre") || ""
    const tipoProducto = searchParams.get("tipoProducto") || ""
    const estado = searchParams.get("estado") || ""

    // Construir filtro
    let filtro = {
      deletedAt: null,
    }

    if (nombre) {
      filtro = {
        ...filtro,
        OR: [
          { nombreProducto: { contains: nombre, mode: "insensitive" } },
          { descripcion: { contains: nombre, mode: "insensitive" } },
        ],
      }
    }

    if (tipoProducto && !isNaN(Number.parseInt(tipoProducto))) {
      filtro.idTipoProducto = Number.parseInt(tipoProducto)
    }

    if (estado && !isNaN(Number.parseInt(estado))) {
      filtro.idEstadoProducto = Number.parseInt(estado)
    }

    // Obtener productos con su stock
    const productos = await prisma.producto.findMany({
      where: filtro,
      include: {
        tipoProducto: true,
        unidadMedida: true,
        estadoProducto: true,
      },
      orderBy: {
        nombreProducto: "asc",
      },
    })

    // Registrar auditoría
    await AuditoriaService({
      accion: "CONSULTA_STOCK_PRODUCTOS",
      tabla: "Producto",
      descripcion: `Consulta de stock de productos${nombre ? ` con filtro: ${nombre}` : ""}`,
      data: { filtro },
    })

    return NextResponse.json({ productos })
  } catch (error) {
    console.error("Error al obtener stock de productos:", error)
    return NextResponse.json({ error: "Error al obtener stock de productos", detalles: error.message }, { status: 500 })
  }
}

/**
 * Actualiza el stock de un producto
 * @param {Request} request - La solicitud HTTP
 * @returns {Promise<NextResponse>} - Respuesta con el resultado de la actualización
 */
export async function POST(request) {
  try {
    // Verificar autenticación en producción
    if (!isDevelopment) {
      const token = request.headers.get("authorization")?.split(" ")[1]
      if (!token) {
        return NextResponse.json({ error: "Token no proporcionado" }, { status: 401 })
      }

      const tokenValido = await AuthController(token)
      if (!tokenValido) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
      }
    }

    const data = await request.json()
    const { idProducto, cantidad, observacion } = data

    if (!idProducto || cantidad === undefined) {
      return NextResponse.json({ error: "Se requiere idProducto y cantidad" }, { status: 400 })
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Obtener producto actual
      const producto = await tx.producto.findUnique({
        where: { idProducto, deletedAt: null },
      })

      if (!producto) {
        throw new Error(`Producto con ID ${idProducto} no encontrado`)
      }

      // Calcular nuevo stock
      const nuevoStock = Number.parseFloat(producto.stockActual || 0) + Number.parseFloat(cantidad)

      if (nuevoStock < 0) {
        throw new Error("El stock no puede ser negativo")
      }

      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { idProducto },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      // Registrar movimiento en inventario (si se implementa en el futuro)
      // Por ahora, solo registramos la auditoría

      return { productoActualizado }
    })

    // Registrar auditoría
    await AuditoriaService({
      accion: "ACTUALIZAR_STOCK_PRODUCTO",
      tabla: "Producto",
      descripcion: `Actualización de stock del producto ID: ${idProducto}, Cantidad: ${cantidad}, Observación: ${observacion || "N/A"}`,
      data,
    })

    return NextResponse.json({
      mensaje: "Stock actualizado correctamente",
      producto: resultado.productoActualizado,
    })
  } catch (error) {
    console.error("Error al actualizar stock de producto:", error)
    return NextResponse.json(
      { error: "Error al actualizar stock de producto", detalles: error.message },
      { status: 500 },
    )
  }
}

/**
 * Registra un movimiento de inventario para un producto
 * @param {Request} request - La solicitud HTTP
 * @returns {Promise<NextResponse>} - Respuesta con el resultado del registro
 */
export async function PUT(request) {
  try {
    // Verificar autenticación en producción
    if (!isDevelopment) {
      const token = request.headers.get("authorization")?.split(" ")[1]
      if (!token) {
        return NextResponse.json({ error: "Token no proporcionado" }, { status: 401 })
      }

      const tokenValido = await AuthController(token)
      if (!tokenValido) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
      }
    }

    const data = await request.json()
    const { idProducto, cantidad, idOrdenProduccion, observacion } = data

    if (!idProducto || cantidad === undefined) {
      return NextResponse.json({ error: "Se requiere idProducto y cantidad" }, { status: 400 })
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Obtener producto actual
      const producto = await tx.producto.findUnique({
        where: { idProducto, deletedAt: null },
        include: { unidadMedida: true },
      })

      if (!producto) {
        throw new Error(`Producto con ID ${idProducto} no encontrado`)
      }

      // Calcular nuevo stock
      const nuevoStock = Number.parseFloat(producto.stockActual || 0) + Number.parseFloat(cantidad)

      if (nuevoStock < 0) {
        throw new Error("El stock no puede ser negativo")
      }

      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { idProducto },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      // Registrar movimiento en inventario (si se implementa en el futuro)
      // Por ahora, solo registramos la auditoría

      return { productoActualizado }
    })

    // Registrar auditoría
    await AuditoriaService({
      accion: "REGISTRAR_MOVIMIENTO_PRODUCTO",
      tabla: "Producto",
      descripcion: `Registro de movimiento para producto ID: ${idProducto}, Cantidad: ${cantidad}, Orden Producción: ${idOrdenProduccion || "N/A"}, Observación: ${observacion || "N/A"}`,
      data,
    })

    return NextResponse.json({
      mensaje: "Movimiento registrado correctamente",
      producto: resultado.productoActualizado,
    })
  } catch (error) {
    console.error("Error al registrar movimiento de producto:", error)
    return NextResponse.json(
      { error: "Error al registrar movimiento de producto", detalles: error.message },
      { status: 500 },
    )
  }
}


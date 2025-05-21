import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()
const auditoriaService = new AuditoriaService()
const authController = new AuthController()

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

      const tokenValido = await authController.verificarToken(token)
      if (!tokenValido) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
      }
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const nombre = searchParams.get("nombre") || ""
    const estado = searchParams.get("estado") || ""
    const loadAll = searchParams.get("loadAll") === "true"

    // Si no hay filtros y no se solicita cargar todo, devolver array vacío
    if (!nombre && !estado && !loadAll) {
      console.log("API: No se proporcionaron filtros y no se solicitó cargar todo")
      return NextResponse.json({ productos: [] })
    }

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

    if (estado && estado !== "todos" && !isNaN(Number.parseInt(estado))) {
      filtro.idEstadoProducto = Number.parseInt(estado)
    }

    console.log("API: Buscando productos con filtro:", filtro)

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

    console.log(`API: Se encontraron ${productos.length} productos`)

    // NO registramos auditoría para consultas como solicitó el usuario

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

      const tokenValido = await authController.verificarToken(token)
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
      const stockAnterior = Number.parseFloat(producto.stockActual || 0)
      const nuevoStock = stockAnterior + Number.parseFloat(cantidad)

      if (nuevoStock < 0) {
        throw new Error("El stock no puede ser negativo")
      }

      // Si no hay cambio en el stock, no hacer nada
      if (stockAnterior === nuevoStock) {
        return { productoActualizado: producto, cambioRealizado: false }
      }

      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { idProducto },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      return { productoActualizado, cambioRealizado: true, stockAnterior }
    })

    // Registrar auditoría solo si hubo un cambio real
    if (resultado.cambioRealizado) {
      await auditoriaService.registrarEvento(
        "Inventario",
        "ACTUALIZAR_STOCK_PRODUCTO",
        `Actualización de stock del producto ID: ${idProducto}, Stock anterior: ${resultado.stockAnterior}, Nuevo stock: ${resultado.productoActualizado.stockActual}, Ajuste: ${cantidad}, Observación: ${observacion || "N/A"}`,
        1, // Usuario ficticio para desarrollo
        request,
        {
          idProducto,
          stockAnterior: resultado.stockAnterior,
          nuevoStock: resultado.productoActualizado.stockActual,
          ajuste: cantidad,
          observacion,
        },
      )
    }

    return NextResponse.json({
      mensaje: resultado.cambioRealizado ? "Stock actualizado correctamente" : "No hubo cambios en el stock",
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

      const tokenValido = await authController.verificarToken(token)
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
      const stockAnterior = Number.parseFloat(producto.stockActual || 0)
      const nuevoStock = stockAnterior + Number.parseFloat(cantidad)

      if (nuevoStock < 0) {
        throw new Error("El stock no puede ser negativo")
      }

      // Si no hay cambio en el stock, no hacer nada
      if (stockAnterior === nuevoStock) {
        return { productoActualizado: producto, cambioRealizado: false }
      }

      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { idProducto },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      return { productoActualizado, cambioRealizado: true, stockAnterior }
    })

    // Registrar auditoría solo si hubo un cambio real
    if (resultado.cambioRealizado) {
      await auditoriaService.registrarEvento(
        "Inventario",
        "REGISTRAR_MOVIMIENTO_PRODUCTO",
        `Registro de movimiento para producto ID: ${idProducto}, Stock anterior: ${resultado.stockAnterior}, Nuevo stock: ${resultado.productoActualizado.stockActual}, Ajuste: ${cantidad}, Orden Producción: ${idOrdenProduccion || "N/A"}, Observación: ${observacion || "N/A"}`,
        1, // Usuario ficticio para desarrollo
        request,
        {
          idProducto,
          stockAnterior: resultado.stockAnterior,
          nuevoStock: resultado.productoActualizado.stockActual,
          ajuste: cantidad,
          idOrdenProduccion,
          observacion,
        },
      )
    }

    return NextResponse.json({
      mensaje: resultado.cambioRealizado ? "Movimiento registrado correctamente" : "No hubo cambios en el stock",
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

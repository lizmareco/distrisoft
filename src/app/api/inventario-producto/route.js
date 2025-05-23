import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const authController = new AuthController()
const auditoriaService = new AuditoriaService()

// GET - Obtener registros de inventario de productos
export async function GET(request) {
  try {
    console.log("API: Consultando registros de inventario de productos")

    // BYPASS DE AUTENTICACIÓN PARA DESARROLLO
    let token = null
    let userData = null

    if (process.env.NODE_ENV === "development") {
      console.log("Modo desarrollo: Bypass de autenticación activado")
      token = await authController.hasAccessToken(request)

      if (!token) {
        console.log("Usando token especial de desarrollo")
        token = "dev-mode-bypass-token"
        userData = {
          idUsuario: 1,
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"],
        }
      } else {
        console.log("Token real encontrado en modo desarrollo")
        userData = await authController.getUserFromToken(token)
      }
    } else {
      token = await authController.hasAccessToken(request)
      if (token) {
        userData = await authController.getUserFromToken(token)
      }
    }

    if (!token) {
      console.log("API: No autorizado: Token no encontrado")
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Extraer parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const productoId = searchParams.get("productoId")
    const ordenProduccionId = searchParams.get("ordenProduccionId")
    const tipoMovimiento = searchParams.get("tipoMovimiento")
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const loadAll = searchParams.get("loadAll") === "true"

    // Si no hay filtros y no se solicita cargar todo, devolver array vacío
    if (!productoId && !ordenProduccionId && !tipoMovimiento && !fechaInicio && !fechaFin && !loadAll) {
      console.log("API: No se proporcionaron filtros y no se solicitó cargar todo")
      return NextResponse.json({ movimientos: [] })
    }

    // Construir condiciones de búsqueda
    const where = {
      deletedAt: null,
    }

    if (productoId) {
      where.idProducto = Number.parseInt(productoId)
    }

    if (ordenProduccionId) {
      where.idOrdenProduccion = Number.parseInt(ordenProduccionId)
    }

    if (tipoMovimiento) {
      where.tipoMovimiento = tipoMovimiento.toUpperCase()
    }

    if (fechaInicio || fechaFin) {
      where.fechaMovimiento = {}
      if (fechaInicio) {
        where.fechaMovimiento.gte = new Date(fechaInicio)
      }
      if (fechaFin) {
        where.fechaMovimiento.lte = new Date(fechaFin)
      }
    }

    // Buscar registros de inventario de productos
    const movimientos = await prisma.inventarioProducto.findMany({
      where,
      include: {
        producto: {
          include: {
            tipoProducto: true,
            unidadMedida: true,
            estadoProducto: true,
          },
        },
        ordenProduccion: {
          include: {
            estadoOrdenProd: true,
          },
        },
        usuario: {
          select: {
            idUsuario: true,
            nombre: true,
            apellido: true,
            usuario: true,
          },
        },
      },
      orderBy: {
        fechaMovimiento: "desc",
      },
    })

    console.log(`API: Se encontraron ${movimientos.length} registros de inventario de productos`)

    // Registrar auditoría solo si se encontraron resultados (evitar registros innecesarios)
    if (movimientos.length > 0 && userData) {
      await auditoriaService.registrarAuditoria({
        entidad: "InventarioProducto",
        idRegistro: 0,
        accion: "CONSULTA",
        valorAnterior: null,
        valorNuevo: { filtros: Object.fromEntries(searchParams) },
        idUsuario: userData.idUsuario,
        request,
      })
    }

    return NextResponse.json({ movimientos }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al consultar inventario de productos:", error)
    return NextResponse.json(
      { message: "Error al consultar inventario de productos", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear un nuevo registro de inventario de producto
export async function POST(request) {
  try {
    console.log("API: Creando nuevo registro de inventario de producto")

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = token ? await authController.getUserFromToken(token) : { idUsuario: 1, usuario: "desarrollo" }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()

    if (!data.idProducto || !data.cantidad || !data.tipoMovimiento) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: "Se requiere idProducto, cantidad y tipoMovimiento",
        },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { idProducto: data.idProducto, deletedAt: null },
      include: {
        unidadMedida: true,
      },
    })

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Calcular nuevo stock
      const stockActual = Number.parseFloat(producto.stockActual || 0)
      const cantidadAjuste = Number.parseFloat(data.cantidad)

      // Determinar el ajuste según el tipo de movimiento
      let nuevoStock
      if (data.tipoMovimiento.toUpperCase() === "ENTRADA") {
        nuevoStock = stockActual + cantidadAjuste
      } else if (data.tipoMovimiento.toUpperCase() === "SALIDA") {
        nuevoStock = stockActual - cantidadAjuste
        // Verificar que el stock no quede negativo
        if (nuevoStock < 0) {
          throw new Error("Stock insuficiente para realizar la salida")
        }
      } else {
        throw new Error("Tipo de movimiento inválido. Debe ser ENTRADA o SALIDA")
      }

      // Si no hay cambio real en el stock, no hacer nada
      if (stockActual === nuevoStock) {
        return {
          productoActualizado: producto,
          movimiento: null,
          cambioRealizado: false,
        }
      }

      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { idProducto: data.idProducto },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      // Crear registro de movimiento en inventario
      const movimiento = await tx.inventarioProducto.create({
        data: {
          idProducto: data.idProducto,
          cantidad: cantidadAjuste,
          unidadMedida: data.unidadMedida || producto.unidadMedida?.abreviatura || "Unidad",
          tipoMovimiento: data.tipoMovimiento.toUpperCase(),
          fechaMovimiento: data.fechaMovimiento ? new Date(data.fechaMovimiento) : new Date(),
          idOrdenProduccion: data.idOrdenProduccion || null,
          motivo: data.motivo || `Ajuste manual de stock: ${data.tipoMovimiento.toUpperCase()}`,
          observacion: data.observacion || null,
        },
        include: {
          producto: true,
          ordenProduccion: true,
        },
      })

      return {
        productoActualizado,
        movimiento,
        cambioRealizado: true,
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
      }
    })

    // Registrar la acción en auditoría solo si hubo un cambio real
    if (resultado.cambioRealizado) {
      await auditoriaService.registrarCreacion(
        "InventarioProducto",
        resultado.movimiento.idInventarioProducto,
        {
          idProducto: resultado.movimiento.idProducto,
          cantidad: resultado.movimiento.cantidad,
          tipoMovimiento: resultado.movimiento.tipoMovimiento,
          producto: resultado.movimiento.producto.nombreProducto,
          stockAnterior: resultado.stockAnterior,
          nuevoStock: resultado.stockNuevo,
        },
        userData.idUsuario,
        request,
      )

      console.log(`API: Movimiento de inventario creado con ID: ${resultado.movimiento.idInventarioProducto}`)
    } else {
      console.log("API: No hubo cambio real en el stock, no se creó movimiento")
    }

    return NextResponse.json(
      {
        mensaje: resultado.cambioRealizado ? "Movimiento registrado correctamente" : "No hubo cambios en el stock",
        producto: resultado.productoActualizado,
        movimiento: resultado.movimiento,
        cambioRealizado: resultado.cambioRealizado,
      },
      { status: resultado.cambioRealizado ? HTTP_STATUS_CODES.created : HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al crear registro de inventario de producto:", error)
    return NextResponse.json(
      { message: "Error al crear registro de inventario de producto", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

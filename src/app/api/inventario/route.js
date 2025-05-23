import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

const authController = new AuthController()
const auditoriaService = new AuditoriaService()

// GET - Obtener registros de inventario
export async function GET(request) {
  try {
    console.log("API: Consultando registros de inventario")

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
    const search = searchParams.get("search")
    const materiaPrimaId = searchParams.get("materiaPrimaId")
    const ordenCompraId = searchParams.get("ordenCompraId")
    const tipoMovimiento = searchParams.get("tipoMovimiento")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Construir condiciones de búsqueda
    const where = {
      deletedAt: null,
    }

    if (materiaPrimaId) {
      where.idMateriaPrima = Number.parseInt(materiaPrimaId)
    }

    if (ordenCompraId) {
      where.idOrdenCompra = Number.parseInt(ordenCompraId)
    }

    if (tipoMovimiento !== null && tipoMovimiento !== undefined) {
      // Si tipoMovimiento está presente pero vacío, no aplicar filtro
      if (tipoMovimiento !== "") {
        where.tipoMovimiento = tipoMovimiento.toUpperCase()
      }
      // Si tipoMovimiento es vacío, no añadir filtro (traer todos)
    }

    if (fechaDesde || fechaHasta) {
      where.fechaMovimiento = {}
      if (fechaDesde) {
        where.fechaMovimiento.gte = new Date(fechaDesde)
      }
      if (fechaHasta) {
        where.fechaMovimiento.lte = new Date(fechaHasta)
      }
    }

    // Si hay término de búsqueda, buscar en materias primas relacionadas
    if (search) {
      where.materiaPrima = {
        nombreMateriaPrima: {
          contains: search,
          mode: "insensitive",
        },
      }
    }

    // Contar total de registros para paginación
    const totalRegistros = await prisma.inventario.count({ where })

    // Modificar la consulta findMany para eliminar la inclusión de usuario que no existe en el modelo

    // Buscar registros de inventario
    const movimientos = await prisma.inventario.findMany({
      where,
      include: {
        materiaPrima: {
          include: {
            estadoMateriaPrima: true,
          },
        },
        ordenCompra: {
          include: {
            estadoOrdenCompra: true,
          },
        },
        // Eliminar esta parte ya que no existe la relación usuario en el modelo Inventario
        // usuario: {
        //   select: {
        //     idUsuario: true,
        //     nombre: true,
        //     apellido: true,
        //     usuario: true,
        //   },
        // },
      },
      orderBy: {
        fechaMovimiento: "desc",
      },
      skip,
      take: limit,
    })

    console.log(`API: Se encontraron ${movimientos.length} registros de inventario`)

    // Registrar auditoría solo si se encontraron resultados (evitar registros innecesarios)
    if (movimientos.length > 0 && userData) {
      await auditoriaService.registrarAuditoria({
        entidad: "Inventario",
        idRegistro: 0,
        accion: "CONSULTA",
        valorAnterior: null,
        valorNuevo: { filtros: Object.fromEntries(searchParams) },
        idUsuario: userData.idUsuario,
        request,
      })
    }

    return NextResponse.json(
      {
        movimientos,
        meta: {
          total: totalRegistros,
          page,
          limit,
          totalPages: Math.ceil(totalRegistros / limit),
        },
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al consultar inventario:", error)
    return NextResponse.json(
      { message: "Error al consultar inventario", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear un nuevo registro de inventario
export async function POST(request) {
  try {
    console.log("API: Creando nuevo registro de inventario")

    // Verificar autenticación
    const token = await authController.hasAccessToken(request)
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = token ? await authController.getUserFromToken(token) : { idUsuario: 1, usuario: "desarrollo" }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()

    if (!data.idMateriaPrima || !data.cantidad || !data.tipoMovimiento) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: "Se requiere idMateriaPrima, cantidad y tipoMovimiento",
        },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que la materia prima existe
    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: { idMateriaPrima: data.idMateriaPrima, deletedAt: null },
    })

    if (!materiaPrima) {
      return NextResponse.json({ error: "Materia prima no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Calcular nuevo stock
      const stockActual = Number.parseFloat(materiaPrima.stockActual || 0)
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
          materiaPrimaActualizada: materiaPrima,
          movimiento: null,
          cambioRealizado: false,
        }
      }

      // Actualizar stock de la materia prima
      const materiaPrimaActualizada = await tx.materiaPrima.update({
        where: { idMateriaPrima: data.idMateriaPrima },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

      // Crear registro de movimiento en inventario
      const movimiento = await tx.inventario.create({
        data: {
          idMateriaPrima: data.idMateriaPrima,
          cantidad: cantidadAjuste,
          unidadMedida: data.unidadMedida || "Unidad",
          tipoMovimiento: data.tipoMovimiento.toUpperCase(),
          fechaMovimiento: data.fechaMovimiento ? new Date(data.fechaMovimiento) : new Date(),
          idOrdenCompra: data.idOrdenCompra || null,
          motivo: data.motivo || `Ajuste manual de stock: ${data.tipoMovimiento.toUpperCase()}`,
          observacion: data.observacion || null,
        },
        include: {
          materiaPrima: true,
          ordenCompra: true,
        },
      })

      return {
        materiaPrimaActualizada,
        movimiento,
        cambioRealizado: true,
        stockAnterior: stockActual,
        stockNuevo: nuevoStock,
      }
    })

    // Registrar la acción en auditoría solo si hubo un cambio real
    if (resultado.cambioRealizado) {
      await auditoriaService.registrarCreacion(
        "Inventario",
        resultado.movimiento.idInventario,
        {
          idMateriaPrima: resultado.movimiento.idMateriaPrima,
          cantidad: resultado.movimiento.cantidad,
          tipoMovimiento: resultado.movimiento.tipoMovimiento,
          materiaPrima: resultado.movimiento.materiaPrima.nombreMateriaPrima,
          stockAnterior: resultado.stockAnterior,
          nuevoStock: resultado.stockNuevo,
        },
        userData.idUsuario,
        request,
      )

      console.log(`API: Movimiento de inventario creado con ID: ${resultado.movimiento.idInventario}`)
    } else {
      console.log("API: No hubo cambio real en el stock, no se creó movimiento")
    }

    return NextResponse.json(
      {
        mensaje: resultado.cambioRealizado ? "Movimiento registrado correctamente" : "No hubo cambios en el stock",
        materiaPrima: resultado.materiaPrimaActualizada,
        movimiento: resultado.movimiento,
        cambioRealizado: resultado.cambioRealizado,
      },
      { status: resultado.cambioRealizado ? HTTP_STATUS_CODES.created : HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    console.error("API: Error al crear registro de inventario:", error)
    return NextResponse.json(
      { message: "Error al crear registro de inventario", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

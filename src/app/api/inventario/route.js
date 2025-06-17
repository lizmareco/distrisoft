import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import cookie from "cookie" 

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) return 1

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

// GET - Obtener registros de inventario
export async function GET(request) {
  try {
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

    const where = {
      deletedAt: null,
    }

    if (materiaPrimaId) {
      where.idMateriaPrima = Number.parseInt(materiaPrimaId)
    }

    if (ordenCompraId) {
      where.idOrdenCompra = Number.parseInt(ordenCompraId)
    }

    if (tipoMovimiento !== null && tipoMovimiento !== undefined && tipoMovimiento !== "") {
      where.tipoMovimiento = tipoMovimiento.toUpperCase()
    }

    if (fechaDesde || fechaHasta) {
      where.fechaMovimiento = {}
      if (fechaDesde) where.fechaMovimiento.gte = new Date(fechaDesde)
      if (fechaHasta) where.fechaMovimiento.lte = new Date(fechaHasta)
    }

    if (search) {
      where.materiaPrima = {
        nombreMateriaPrima: {
          contains: search,
          mode: "insensitive",
        },
      }
    }

    const totalRegistros = await prisma.inventario.count({ where })

    const movimientos = await prisma.inventario.findMany({
      where,
      include: {
        materiaPrima: {
          include: { estadoMateriaPrima: true },
        },
        ordenCompra: {
          include: { estadoOrdenCompra: true },
        },
      },
      orderBy: { fechaMovimiento: "desc" },
      skip,
      take: limit,
    })

    return NextResponse.json(
      {
        movimientos: movimientos.map(mov => ({
          ...mov,
          stockAntes: mov.stockAntes ?? 0,
          stockDespues: mov.stockDespues ?? 0,
        })),
        meta: {
          total: totalRegistros,
          page,
          limit,
          totalPages: Math.ceil(totalRegistros / limit),
        },
      },
      { status: HTTP_STATUS_CODES.ok }
    )
  } catch (error) {
    return NextResponse.json(
      { message: "Error al consultar inventario", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError }
    )
  }
}

// POST - Crear un nuevo registro de inventario
export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)
    const data = await request.json()

    if (!data.idMateriaPrima || !data.cantidad || !data.tipoMovimiento) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: "Se requiere idMateriaPrima, cantidad y tipoMovimiento",
        },
        { status: HTTP_STATUS_CODES.badRequest }
      )
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const materiaPrima = await tx.materiaPrima.findFirst({
        where: { idMateriaPrima: data.idMateriaPrima, deletedAt: null },
      })

      if (!materiaPrima) throw new Error("Materia prima no encontrada")

      const stockActual = +materiaPrima.stockActual || 0
      const cantidadAjuste = Number.parseFloat(data.cantidad ?? 0)

      let nuevoStock
      if (data.tipoMovimiento.toUpperCase() === "ENTRADA") {
        nuevoStock = stockActual + cantidadAjuste
      } else if (data.tipoMovimiento.toUpperCase() === "SALIDA") {
        nuevoStock = stockActual - cantidadAjuste
        if (nuevoStock < 0) throw new Error("Stock insuficiente para realizar la salida")
      } else {
        throw new Error("Tipo de movimiento inválido. Debe ser ENTRADA o SALIDA")
      }

      if (stockActual === nuevoStock) {
        return {
          materiaPrimaActualizada: materiaPrima,
          movimiento: null,
          cambioRealizado: false,
        }
      }

      const materiaPrimaActualizada = await tx.materiaPrima.update({
        where: { idMateriaPrima: data.idMateriaPrima },
        data: {
          stockActual: nuevoStock,
          updatedAt: new Date(),
        },
      })

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
          stockAntes: stockActual,
          stockDespues: nuevoStock,
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
        idUsuario,
        auditoriaService.obtenerDireccionIP(request),
        auditoriaService.obtenerInfoNavegador(request)
      )
    }

    return NextResponse.json(
      {
        mensaje: resultado.cambioRealizado ? "Movimiento registrado correctamente" : "No hubo cambios en el stock",
        materiaPrima: resultado.materiaPrimaActualizada,
        movimiento: resultado.movimiento,
        cambioRealizado: resultado.cambioRealizado,
      },
      { status: resultado.cambioRealizado ? HTTP_STATUS_CODES.created : HTTP_STATUS_CODES.ok }
    )
  } catch (error) {
    return NextResponse.json(
      { message: "Error al crear registro de inventario", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError }
    )
  }
}

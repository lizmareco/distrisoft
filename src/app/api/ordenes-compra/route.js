import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener órdenes de compra con filtros
export async function GET(request) {
  try {
    console.log("API: Obteniendo órdenes de compra...")

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("search") || ""
    const idCotizacion = searchParams.get("idCotizacion") || ""
    const estado = searchParams.get("estado") || ""
    const idProveedor = searchParams.get("idProveedor") || ""
    const idOrdenCompra = searchParams.get("idOrdenCompra") || ""
    const mostrarTodas = searchParams.get("mostrarTodas") === "true"

    // Construir condiciones de búsqueda
    let whereCondition = {
      deletedAt: null,
    }

    // Filtrar por ID de orden de compra si se proporciona
    if (idOrdenCompra) {
      whereCondition.idOrdenCompra = Number.parseInt(idOrdenCompra)
    }

    // Filtrar por ID de cotización si se proporciona
    if (idCotizacion) {
      whereCondition.idCotizacionProveedor = Number.parseInt(idCotizacion)
    }

    // Filtrar por estado si se proporciona
    if (estado) {
      whereCondition.estadoOrdenCompra = {
        descEstadoOrdenCompra: estado,
      }
    }

    // Filtrar por proveedor si se proporciona
    if (idProveedor) {
      whereCondition.cotizacionProveedor = {
        idProveedor: Number.parseInt(idProveedor),
      }
    }

    // Si hay término de búsqueda, aplicar filtros adicionales
    if (searchTerm) {
      // Intentar convertir el término de búsqueda a número para buscar por ID
      const searchId = !isNaN(Number.parseInt(searchTerm)) ? Number.parseInt(searchTerm) : undefined

      // Construir condiciones de búsqueda
      whereCondition = {
        ...whereCondition,
        OR: [
          // Búsqueda por ID de orden de compra
          ...(searchId ? [{ idOrdenCompra: searchId }] : []),
          // Búsqueda por proveedor (a través de la cotización)
          {
            cotizacionProveedor: {
              proveedor: {
                empresa: {
                  razonSocial: { contains: searchTerm, mode: "insensitive" },
                },
              },
            },
          },
          // Búsqueda por observación
          {
            observacion: { contains: searchTerm, mode: "insensitive" },
          },
        ],
      }
    }

    // Si no se solicita mostrar todas y no hay filtros específicos, limitar a las más recientes
    if (!mostrarTodas && !searchTerm && !idCotizacion && !estado && !idProveedor && !idOrdenCompra) {
      whereCondition = {
        ...whereCondition,
        // Limitar a órdenes creadas en los últimos 30 días
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }
    }

    console.log("API: Condición de búsqueda:", JSON.stringify(whereCondition, null, 2))

    // Obtener órdenes de compra con sus relaciones y aplicar filtro de búsqueda
    const ordenesCompra = await prisma.ordenCompra.findMany({
      where: whereCondition,
      include: {
        cotizacionProveedor: {
          include: {
            proveedor: {
              include: {
                empresa: true,
              },
            },
            detallesCotizacionProv: {
              include: {
                materiaPrima: true,
              },
            },
          },
        },
        estadoOrdenCompra: true,
      },
      orderBy: {
        fechaOrden: "desc",
      },
    })

    console.log(`API: Se encontraron ${ordenesCompra.length} órdenes de compra`)
    return NextResponse.json(ordenesCompra, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener órdenes de compra:", error)
    return NextResponse.json(
      { message: "Error al obtener órdenes de compra", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear una nueva orden de compra
export async function POST(request) {
  try {
    console.log("API: Creando nueva orden de compra...")
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // Obtener el usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    const userData = await authController.getUserFromToken(accessToken)
    if (!userData) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Obtener datos de la orden de compra
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idCotizacionProveedor) {
      return NextResponse.json(
        { message: "Se requiere el ID de la cotización del proveedor" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar que la cotización existe y está aprobada
    const cotizacion = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: Number.parseInt(data.idCotizacionProveedor),
        deletedAt: null,
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ message: "Cotización no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    if (cotizacion.estado !== "APROBADA") {
      return NextResponse.json(
        { message: "Solo se pueden crear órdenes de compra a partir de cotizaciones aprobadas" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar si ya existe una orden de compra para esta cotización
    const ordenExistente = await prisma.ordenCompra.findFirst({
      where: {
        idCotizacionProveedor: Number.parseInt(data.idCotizacionProveedor),
        deletedAt: null,
      },
    })

    if (ordenExistente) {
      return NextResponse.json(
        { message: "Ya existe una orden de compra para esta cotización" },
        { status: HTTP_STATUS_CODES.conflict },
      )
    }

    // Obtener el ID del estado "PENDIENTE" (asumiendo que es el ID 1)
    const estadoPendiente = await prisma.estadoOrdenCompra.findFirst({
      where: {
        idEstadoOrdenCompra: 1,
      },
    })

    if (!estadoPendiente) {
      return NextResponse.json(
        { message: "No se encontró el estado 'PENDIENTE' para órdenes de compra" },
        { status: HTTP_STATUS_CODES.internalServerError },
      )
    }

    // Crear la orden de compra
    const ordenCompra = await prisma.ordenCompra.create({
      data: {
        fechaOrden: new Date(),
        idEstadoOrdenCompra: estadoPendiente.idEstadoOrdenCompra,
        idCotizacionProveedor: Number.parseInt(data.idCotizacionProveedor),
        observacion: data.observacion || "",
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion(
      "OrdenCompra",
      ordenCompra.idOrdenCompra,
      ordenCompra,
      userData.idUsuario,
      request,
    )

    console.log(`API: Orden de compra creada con ID: ${ordenCompra.idOrdenCompra}`)
    return NextResponse.json(
      { message: "Orden de compra creada exitosamente", idOrdenCompra: ordenCompra.idOrdenCompra },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear orden de compra:", error)
    return NextResponse.json(
      { message: "Error al crear orden de compra", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener cotizaciones con filtro de búsqueda
export async function GET(request) {
  try {
    console.log("API: Obteniendo cotizaciones...")

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("search") || ""

    // Si no hay término de búsqueda, devolver un array vacío en lugar de todas las cotizaciones
    if (!searchTerm) {
      console.log("API: No se proporcionó término de búsqueda, devolviendo array vacío")
      return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
    }

    // Intentar convertir el término de búsqueda a número para buscar por ID
    const searchId = !isNaN(Number.parseInt(searchTerm)) ? Number.parseInt(searchTerm) : undefined

    // Construir condiciones de búsqueda
    const searchCondition = {
      deletedAt: null,
      OR: [
        // Búsqueda por ID de cotización
        searchId ? { idCotizacionCliente: searchId } : {},
        // Búsqueda por nombre o apellido del cliente (case insensitive)
        {
          cliente: {
            persona: {
              OR: [
                { nombre: { contains: searchTerm, mode: "insensitive" } },
                { apellido: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        },
        // Búsqueda por número de documento del cliente (case insensitive)
        {
          cliente: {
            persona: {
              nroDocumento: { contains: searchTerm, mode: "insensitive" },
            },
          },
        },
        // Búsqueda por nombre o apellido del vendedor (case insensitive)
        {
          usuario: {
            persona: {
              OR: [
                { nombre: { contains: searchTerm, mode: "insensitive" } },
                { apellido: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    }

    // Obtener cotizaciones con sus relaciones y aplicar filtro de búsqueda
    const cotizaciones = await prisma.cotizacionCliente.findMany({
      where: searchCondition,
      include: {
        cliente: {
          include: {
            persona: {
              include: {
                tipoDocumento: true,
              },
            },
            empresa: true,
          },
        },
        usuario: {
          include: {
            persona: true,
          },
        },
        estadoCotizacionCliente: true,
      },
      orderBy: {
        fechaCotizacion: "desc",
      },
    })

    console.log(`API: Se encontraron ${cotizaciones.length} cotizaciones para el término "${searchTerm}"`)
    return NextResponse.json(cotizaciones, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener cotizaciones:", error)
    return NextResponse.json(
      { message: "Error al obtener cotizaciones", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear una nueva cotización
export async function POST(request) {
  try {
    console.log("API: Creando nueva cotización...")
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

    // Obtener datos de la cotización
    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idCliente || !data.validez || !data.productos || data.productos.length === 0) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Obtener el ID del estado "Pendiente" (asumiendo que es el ID 1)
    const estadoPendiente = await prisma.estadoCotizacionCliente.findFirst({
      where: {
        descEstadoCotizacionCliente: "PENDIENTE",
      },
    })

    if (!estadoPendiente) {
      return NextResponse.json(
        { message: "No se encontró el estado 'PENDIENTE' para cotizaciones" },
        { status: HTTP_STATUS_CODES.internalServerError },
      )
    }

    // Crear la cotización
    const cotizacion = await prisma.cotizacionCliente.create({
      data: {
        fechaCotizacion: new Date(),
        vendedor: userData.idUsuario,
        montoTotal: data.montoTotal,
        idCliente: Number.parseInt(data.idCliente),
        validez: Number.parseInt(data.validez),
        idEstadoCotizacionCliente: estadoPendiente.idEstadoCotizacionCliente,
      },
    })

    // Crear los detalles de la cotización
    for (const producto of data.productos) {
      await prisma.detalleCotizacionCliente.create({
        data: {
          idCotizacionCliente: cotizacion.idCotizacionCliente,
          idProducto: Number.parseInt(producto.idProducto),
          cantidad: Number.parseInt(producto.cantidad),
          subtotal: Number.parseFloat(producto.subtotal),
        },
      })
    }

    // Obtener la cotización completa con sus relaciones para la auditoría
    const cotizacionCompleta = await prisma.cotizacionCliente.findUnique({
      where: {
        idCotizacionCliente: cotizacion.idCotizacionCliente,
      },
      include: {
        cliente: {
          include: {
            persona: true,
            empresa: true,
          },
        },
        usuario: {
          include: {
            persona: true,
          },
        },
        estadoCotizacionCliente: true,
        detalleCotizacionCliente: {
          include: {
            producto: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion(
      "CotizacionCliente",
      cotizacion.idCotizacionCliente,
      cotizacionCompleta,
      userData.idUsuario,
      request,
    )

    console.log(`API: Cotización creada con ID: ${cotizacion.idCotizacionCliente}`)
    return NextResponse.json(
      { message: "Cotización creada exitosamente", idCotizacionCliente: cotizacion.idCotizacionCliente },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear cotización:", error)
    return NextResponse.json(
      { message: "Error al crear cotización", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

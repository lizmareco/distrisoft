import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// GET - Obtener cotizaciones de proveedores con filtro de búsqueda
export async function GET(request) {
  try {
    console.log("API: Obteniendo cotizaciones de proveedores...")

    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get("search") || ""

    // Condición base: solo cotizaciones no eliminadas
    let whereCondition = {
      deletedAt: null,
    }

    // Si hay término de búsqueda, aplicar filtros adicionales
    if (searchTerm) {
      // Intentar convertir el término de búsqueda a número para buscar por ID
      const searchId = !isNaN(Number.parseInt(searchTerm)) ? Number.parseInt(searchTerm) : undefined

      // Construir condiciones de búsqueda
      whereCondition = {
        deletedAt: null,
        OR: [
          // Búsqueda por ID de cotización
          ...(searchId ? [{ idCotizacionProveedor: searchId }] : []),
          // Búsqueda por empresa (razón social)
          {
            proveedor: {
              empresa: {
                razonSocial: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
          // Búsqueda por contacto de empresa
          {
            proveedor: {
              empresa: {
                contacto: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
        ],
      }
    }

    console.log("API: Condición de búsqueda:", JSON.stringify(whereCondition, null, 2))

    // Obtener cotizaciones con sus relaciones y aplicar filtro de búsqueda
    const cotizaciones = await prisma.cotizacionProveedor.findMany({
      where: whereCondition,
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
      orderBy: {
        fechaCotizacionProveedor: "desc",
      },
    })

    console.log(
      `API: Se encontraron ${cotizaciones.length} cotizaciones${searchTerm ? ` para el término "${searchTerm}"` : ""}`,
    )
    return NextResponse.json(cotizaciones, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener cotizaciones de proveedores:", error)
    return NextResponse.json(
      { message: "Error al obtener cotizaciones de proveedores", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

// POST - Crear una nueva cotización de proveedor
export async function POST(request) {
  try {
    console.log("API: Creando nueva cotización de proveedor...")
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
    if (!data.idProveedor || !data.validez || !data.materiasPrimas || data.materiasPrimas.length === 0) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Crear la cotización con estado PENDIENTE
    const cotizacion = await prisma.cotizacionProveedor.create({
      data: {
        idProveedor: Number.parseInt(data.idProveedor),
        fechaCotizacionProveedor: new Date(),
        validez: Number.parseInt(data.validez),
        montoTotal: data.montoTotal || data.materiasPrimas.reduce((total, item) => total + item.subtotal, 0),
        estado: "PENDIENTE",
      },
    })

    // Crear los detalles de la cotización para cada materia prima
    for (const materiaPrima of data.materiasPrimas) {
      await prisma.detalleCotizacionProv.create({
        data: {
          idCotizacionProveedor: cotizacion.idCotizacionProveedor,
          idMateriaPrima: Number.parseInt(materiaPrima.idMateriaPrima),
          cantidad: Number.parseInt(materiaPrima.cantidad),
          precioUnitario: Number.parseFloat(materiaPrima.precioUnitario),
          subtotal: Number.parseFloat(materiaPrima.subtotal),
        },
      })
    }

    // Obtener la cotización básica para la auditoría (sin incluir detalles)
    const cotizacionBasica = await prisma.cotizacionProveedor.findUnique({
      where: {
        idCotizacionProveedor: cotizacion.idCotizacionProveedor,
      },
      include: {
        proveedor: {
          include: {
            empresa: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría con datos básicos
    await auditoriaService.registrarCreacion(
      "CotizacionProveedor",
      cotizacion.idCotizacionProveedor,
      cotizacionBasica,
      userData.idUsuario,
      request,
    )

    console.log(`API: Cotización de proveedor creada con ID: ${cotizacion.idCotizacionProveedor}`)
    return NextResponse.json(
      {
        message: "Cotización de proveedor creada exitosamente",
        idCotizacionProveedor: cotizacion.idCotizacionProveedor,
      },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear cotización de proveedor:", error)
    return NextResponse.json(
      { message: "Error al crear cotización de proveedor", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const tipoDocumento = searchParams.get("tipoDocumento")
    const numeroDocumento = searchParams.get("numeroDocumento")

    console.log("API: Buscando proveedores con parámetros:", { tipoDocumento, numeroDocumento })

    // Si se proporcionan parámetros de búsqueda, buscar por tipo y número de documento
    if (tipoDocumento && numeroDocumento) {
      // Buscar proveedores cuyas empresas coincidan con el tipo y número de documento
      const proveedores = await prisma.proveedor.findMany({
        where: {
          deletedAt: null,
          empresa: {
            idTipoDocumento: Number(tipoDocumento),
            ruc: {
              contains: numeroDocumento,
              mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
            },
            deletedAt: null,
          },
        },
        include: {
          empresa: {
            include: {
              tipoDocumento: true,
              persona: true,
            },
          },
        },
        orderBy: {
          idProveedor: "desc",
        },
      })

      console.log(`API: Se encontraron ${proveedores.length} proveedores con los criterios de búsqueda`)
      return NextResponse.json(proveedores, { status: HTTP_STATUS_CODES.ok })
    }

    // Si no hay parámetros de búsqueda, devolver un array vacío en lugar de todos los proveedores
    console.log("API: No se proporcionaron parámetros de búsqueda completos")
    return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar proveedores:", error)
    return NextResponse.json(
      {
        error: "Error al buscar proveedores",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function POST(request) {
  try {
    console.log("API: Creando nuevo proveedor...")
    const auditoriaService = new AuditoriaService()
    const authController = new AuthController()

    // Obtener el usuario actual desde el token (si está autenticado)
    const accessToken = await authController.hasAccessToken(request)
    let idUsuario = null

    if (accessToken) {
      const userData = await authController.getUserFromToken(accessToken)
      idUsuario = userData?.idUsuario || null
    }

    // Si no hay usuario autenticado, usar un ID por defecto para desarrollo
    if (!idUsuario) {
      idUsuario = 1
    }

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idEmpresa) {
      console.error("API: Datos incompletos:", data)
      return NextResponse.json({ error: "Faltan datos requeridos (empresa)" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Crear el proveedor con el nuevo campo comentario
    const proveedor = await prisma.proveedor.create({
      data: {
        idEmpresa: Number.parseInt(data.idEmpresa),
        comentario: data.comentario || "", // Incluir el campo comentario
      },
      include: {
        empresa: {
          include: {
            tipoDocumento: true,
            persona: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Proveedor",
      idRegistro: proveedor.idProveedor.toString(),
      accion: "CREAR",
      valorAnterior: null,
      valorNuevo: proveedor,
      idUsuario: idUsuario,
      request: request,
    })

    console.log("API: Proveedor creado con ID:", proveedor.idProveedor)
    return NextResponse.json(proveedor, { status: HTTP_STATUS_CODES.created })
  } catch (error) {
    console.error("API: Error al crear proveedor:", error)
    return NextResponse.json(
      { error: `Error al crear proveedor: ${error.message}` },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import cookie from "cookie" 

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header (para Next.js App Router y API routes modernas)
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  // Fallback: Authorization header (Bearer)
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) {
    console.warn("NO TOKEN FOUND, defaulting to 1")
    return 1
  }

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

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
              categoriaEmpresa: true,
              ciudad: true,
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
    const idUsuario = await getUserIdFromRequest(request)

    const data = await request.json()
    console.log("API: Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idEmpresa) {
      console.error("API: Datos incompletos:", data)
      return NextResponse.json({ error: "Faltan datos requeridos (empresa)" }, { status: HTTP_STATUS_CODES.badRequest })
    }

    // Verificar si ya existe un proveedor para esta empresa
    const proveedorExistente = await prisma.proveedor.findFirst({
      where: {
        idEmpresa: Number.parseInt(data.idEmpresa),
        deletedAt: null,
      },
    })

    if (proveedorExistente) {
      return NextResponse.json(
        { error: "Ya existe un proveedor registrado para esta empresa" },
        { status: HTTP_STATUS_CODES.conflict },
      )
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
            categoriaEmpresa: true,
            ciudad: true,
          },
        },
      },
    })

    // Extraer información del request
    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion(
      "Proveedor",
      proveedor.idProveedor,
      proveedor,
      idUsuario,
      direccionIP,
      navegador,
    )

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

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
    const ruc = searchParams.get("ruc")
    const razonSocial = searchParams.get("razonSocial")
    
    // Parámetros de paginación
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10)
    const validPage = page > 0 ? page : 1
    const validPageSize = pageSize > 0 && pageSize <= 100 ? pageSize : 10
    const skip = (validPage - 1) * validPageSize

    console.log("API: Buscando proveedores con parámetros:", { ruc, razonSocial })
    console.log(`API: Parámetros de paginación - Página: ${validPage}, Tamaño: ${validPageSize}, Skip: ${skip}`)

    // Si se proporciona RUC o razón social, buscar
    if (ruc || razonSocial) {
      // Construir condiciones de búsqueda
      const whereConditions = {
        deletedAt: null,
        empresa: {
          deletedAt: null,
        },
      }

      // Agregar condiciones de búsqueda según los parámetros proporcionados
      if (ruc && razonSocial) {
        // Buscar por ambos criterios
        whereConditions.empresa.AND = [
          {
            ruc: {
              contains: ruc,
              mode: "insensitive",
            },
          },
          {
            razonSocial: {
              contains: razonSocial,
              mode: "insensitive",
            },
          },
        ]
      } else if (ruc) {
        // Buscar solo por RUC
        whereConditions.empresa.ruc = {
          contains: ruc,
          mode: "insensitive",
        }
      } else if (razonSocial) {
        // Buscar solo por razón social
        whereConditions.empresa.razonSocial = {
          contains: razonSocial,
          mode: "insensitive",
        }
      }

      // Obtener el total de registros para calcular el total de páginas
      const totalProveedores = await prisma.proveedor.count({
        where: whereConditions,
      })

      // Buscar proveedores que coincidan con los criterios
      const proveedores = await prisma.proveedor.findMany({
        where: whereConditions,
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
        skip: skip,
        take: validPageSize,
      })

      console.log(`API: Se encontraron ${proveedores.length} proveedores con los criterios de búsqueda (total: ${totalProveedores})`)

      // Calcular el total de páginas
      const totalPages = Math.ceil(totalProveedores / validPageSize)

      return NextResponse.json({
        proveedores: proveedores,
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          totalItems: totalProveedores,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        },
      }, { status: HTTP_STATUS_CODES.ok })
    }

    // Si no hay parámetros de búsqueda, devolver un array vacío
    console.log("API: No se proporcionaron parámetros de búsqueda")
    return NextResponse.json({
      proveedores: [],
      pagination: {
        page: 1,
        pageSize: validPageSize,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar proveedores:", error)
    return NextResponse.json(
      {
        proveedores: [],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
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

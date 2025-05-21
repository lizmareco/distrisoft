import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuthController from "@/src/backend/controllers/auth-controller"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

const prisma = new PrismaClient()
const authController = new AuthController()
const auditoriaService = new AuditoriaService()

console.log("API Inventario: Endpoint cargado")

export async function GET(request) {
  console.log("API Inventario - Iniciando solicitud GET")
  console.log("API Inventario: Headers recibidos:", Object.fromEntries(request.headers.entries()))

  try {
    // BYPASS DE AUTENTICACIÓN PARA DESARROLLO
    // Esto permitirá que la API funcione sin token en modo desarrollo
    let token = null
    let userData = null

    if (process.env.NODE_ENV === "development") {
      console.log("Modo desarrollo: Bypass de autenticación activado")

      // Verificar si hay un token real primero
      token = await authController.hasAccessToken(request)

      if (!token) {
        console.log("Usando token especial de desarrollo")
        token = "dev-mode-bypass-token"

        // Crear un usuario ficticio para auditorías en modo desarrollo
        userData = {
          idUsuario: 1, // ID de usuario para desarrollo
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"], // Todos los permisos
        }
      } else {
        console.log("Token real encontrado en modo desarrollo")
        userData = await authController.getUserFromToken(token)
      }
    } else {
      // Verificación normal de token para producción
      token = await authController.hasAccessToken(request)
      if (token) {
        userData = await authController.getUserFromToken(token)
      }
    }

    if (!token) {
      console.log("API Inventario - No autorizado: Token no encontrado")
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Registrar auditoría de acceso al inventario
    if (userData) {
      await auditoriaService.registrarAuditoria(
        "Inventario",
        "CONSULTA",
        `Consulta de inventario por usuario ${userData.usuario || userData.nombreUsuario || "desconocido"}`,
        userData.idUsuario,
        request,
        { filtros: Object.fromEntries(new URL(request.url).searchParams) },
      )
    }

    // Extraer parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const idMateriaPrima = searchParams.get("idMateriaPrima")
      ? Number.parseInt(searchParams.get("idMateriaPrima"))
      : null
    const idOrdenCompra = searchParams.get("idOrdenCompra") ? Number.parseInt(searchParams.get("idOrdenCompra")) : null

    // Construir condiciones de búsqueda
    const where = {
      deletedAt: null,
    }

    // Filtrar por materia prima si se proporciona
    if (idMateriaPrima) {
      where.idMateriaPrima = idMateriaPrima
    }

    // Filtrar por orden de compra si se proporciona
    if (idOrdenCompra) {
      where.idOrdenCompra = idOrdenCompra
    }

    // Verificar si existen las tablas necesarias
    let tablesExist = true
    const missingTables = {}

    try {
      // Verificar si existe la tabla MateriaPrima
      await prisma.$queryRaw`SELECT 1 FROM "MateriaPrima" LIMIT 1`
    } catch (error) {
      console.error("Error al verificar tabla MateriaPrima:", error.message)
      tablesExist = false
      missingTables.MateriaPrima = "NO EXISTE"
    }

    try {
      // Verificar si existe la tabla Inventario
      await prisma.$queryRaw`SELECT 1 FROM "Inventario" LIMIT 1`
    } catch (error) {
      console.error("Error al verificar tabla Inventario:", error.message)
      tablesExist = false
      missingTables.Inventario = "NO EXISTE"
    }

    // Si alguna tabla no existe, devolver información de diagnóstico
    if (!tablesExist) {
      return NextResponse.json(
        {
          error: "Error de base de datos: Tablas no encontradas",
          details: missingTables,
        },
        { status: HTTP_STATUS_CODES.internalServerError },
      )
    }

    // Buscar registros de inventario
    const inventario = await prisma.inventario.findMany({
      where,
      include: {
        materiaPrima: true,
        ordenCompra: {
          select: {
            idOrdenCompra: true,
          },
        },
      },
      orderBy: {
        fechaIngreso: "desc",
      },
    })

    // Filtrar por término de búsqueda si se proporciona
    const filteredInventario = search
      ? inventario.filter(
          (item) =>
            (item.materiaPrima &&
              item.materiaPrima.nombreMateriaPrima &&
              item.materiaPrima.nombreMateriaPrima.toLowerCase().includes(search.toLowerCase())) ||
            (item.materiaPrima &&
              item.materiaPrima.descMateriaPrima &&
              item.materiaPrima.descMateriaPrima.toLowerCase().includes(search.toLowerCase())) ||
            (item.observacion && item.observacion.toLowerCase().includes(search.toLowerCase())),
        )
      : inventario

    console.log(`API Inventario - Se encontraron ${filteredInventario.length} registros`)
    return NextResponse.json(filteredInventario, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error en API de inventario:", error)
    return NextResponse.json(
      {
        error: "Error al cargar inventario",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function POST(request) {
  console.log("API Inventario - Iniciando solicitud POST")

  try {
    // BYPASS DE AUTENTICACIÓN PARA DESARROLLO
    // Esto permitirá que la API funcione sin token en modo desarrollo
    let token = null
    let userData = null

    if (process.env.NODE_ENV === "development") {
      console.log("Modo desarrollo: Bypass de autenticación activado")

      // Verificar si hay un token real primero
      token = await authController.hasAccessToken(request)

      if (!token) {
        console.log("Usando token especial de desarrollo")
        token = "dev-mode-bypass-token"

        // Crear un usuario ficticio para auditorías en modo desarrollo
        userData = {
          idUsuario: 1, // ID de usuario para desarrollo
          nombre: "Usuario",
          apellido: "Desarrollo",
          correo: "desarrollo@example.com",
          rol: "ADMINISTRADOR",
          usuario: "desarrollo",
          permisos: ["*"], // Todos los permisos
        }
      } else {
        console.log("Token real encontrado en modo desarrollo")
        userData = await authController.getUserFromToken(token)
      }
    } else {
      // Verificación normal de token para producción
      token = await authController.hasAccessToken(request)
      if (token) {
        userData = await authController.getUserFromToken(token)
      }
    }

    if (!token) {
      console.log("API Inventario - No autorizado: Token no encontrado")
      return NextResponse.json({ error: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Obtener datos del cuerpo de la solicitud
    const data = await request.json()
    console.log("API Inventario - Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.idMateriaPrima || !data.cantidad || !data.unidadMedida) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: "Se requiere idMateriaPrima, cantidad y unidadMedida",
        },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar si existe la materia prima
    const materiaPrima = await prisma.materiaPrima.findUnique({
      where: {
        idMateriaPrima: Number(data.idMateriaPrima),
        deletedAt: null,
      },
    })

    if (!materiaPrima) {
      return NextResponse.json(
        {
          error: "Materia prima no encontrada",
          details: `No se encontró la materia prima con ID ${data.idMateriaPrima}`,
        },
        { status: HTTP_STATUS_CODES.notFound },
      )
    }

    // Crear registro de inventario
    const nuevoInventario = await prisma.inventario.create({
      data: {
        idMateriaPrima: Number(data.idMateriaPrima),
        cantidad: Number(data.cantidad),
        unidadMedida: data.unidadMedida,
        fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
        idOrdenCompra: data.idOrdenCompra ? Number(data.idOrdenCompra) : null,
        observacion: data.observacion || "Ingreso manual",
      },
      include: {
        materiaPrima: true,
      },
    })

    // Registrar auditoría de creación de inventario
    if (userData) {
      await auditoriaService.registrarCreacion(
        "Inventario",
        "CREAR",
        `Creación de registro de inventario ID: ${nuevoInventario.idInventario}`,
        userData.idUsuario,
        request,
        {
          idMateriaPrima: nuevoInventario.idMateriaPrima,
          cantidad: nuevoInventario.cantidad,
          unidadMedida: nuevoInventario.unidadMedida,
          materiaPrima: nuevoInventario.materiaPrima.nombreMateriaPrima,
        },
      )
    }

    console.log("API Inventario - Registro creado:", nuevoInventario)
    return NextResponse.json(nuevoInventario, { status: HTTP_STATUS_CODES.created })
  } catch (error) {
    console.error("Error en API de inventario (POST):", error)
    return NextResponse.json(
      {
        error: "Error al crear registro de inventario",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

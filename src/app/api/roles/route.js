import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

// GET /api/roles - Obtener todos los roles
export async function GET(request) {
  try {
    console.log("API: Recibida solicitud para obtener roles")
    const authController = new AuthController()

    // Verificar si se debe incluir roles inactivos
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"

    console.log(`API roles: Incluir inactivos: ${includeInactive}`)

    // Verificar autenticación
    const accessToken = await authController.hasAccessToken(request)

    // Obtener el token del encabezado de autorización directamente
    const authHeader = request.headers.get("authorization")
    let headerToken = null
    if (authHeader && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.substring(7)
      console.log("Token encontrado en encabezado de autorización")
    }

    // Usar el token del encabezado si está disponible
    const token = headerToken || accessToken

    if (!token) {
      console.log("API roles: No se encontró token válido")

      // En desarrollo, permitir acceso sin token para pruebas
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso sin token")
        // Obtener roles con sus permisos
        const roles = await obtenerRoles(includeInactive)
        console.log("API: Roles obtenidos en modo desarrollo sin token", { cantidad: roles.length })
        return NextResponse.json({ roles }, { status: 200 })
      }

      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Obtener el usuario del token
    let userData = null

    try {
      userData = await authController.getUserFromToken(token)
    } catch (tokenError) {
      console.error("Error al decodificar token:", tokenError)

      // En desarrollo, permitir acceso con token inválido
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso con token inválido")
        const roles = await obtenerRoles(includeInactive)
        console.log("API: Roles obtenidos en modo desarrollo con token inválido", { cantidad: roles.length })
        return NextResponse.json({ roles }, { status: 200 })
      }
    }

    if (!userData) {
      console.log("API roles: No se pudo obtener datos del usuario desde el token")

      // En desarrollo, permitir acceso sin datos de usuario
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso sin datos de usuario")
        const roles = await obtenerRoles(includeInactive)
        console.log("API: Roles obtenidos en modo desarrollo sin permisos adecuados", { cantidad: roles.length })
        return NextResponse.json({ roles }, { status: 200 })
      }

      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario tenga rol de administrador
    if (userData.rol !== "ADMINISTRADOR" && userData.rol !== "ADMINISTRADOR_SISTEMA") {
      console.log("API: Usuario sin permisos para gestionar roles. Rol actual:", userData.rol)

      // En desarrollo, permitir acceso sin importar el rol
      if (process.env.NODE_ENV === "development") {
        console.log("API roles: Modo desarrollo - Permitiendo acceso sin importar el rol")
        const roles = await obtenerRoles(includeInactive)
        console.log("API: Roles obtenidos en modo desarrollo sin permisos adecuados", { cantidad: roles.length })
        return NextResponse.json({ roles }, { status: 200 })
      }

      return NextResponse.json({ message: "No tienes permisos para gestionar roles" }, { status: 403 })
    }

    // Obtener roles con sus permisos
    const roles = await obtenerRoles(includeInactive)

    console.log("API: Roles obtenidos correctamente", { cantidad: roles.length })
    return NextResponse.json({ roles }, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener roles:", error)

    // En desarrollo, permitir acceso incluso si hay un error
    if (process.env.NODE_ENV === "development") {
      console.log("API roles: Modo desarrollo - Permitiendo acceso a pesar del error")
      try {
        const roles = await obtenerRoles(true)
        console.log("API: Roles obtenidos en modo desarrollo a pesar del error", { cantidad: roles.length })
        return NextResponse.json({ roles }, { status: 200 })
      } catch (innerError) {
        console.error("Error en el modo de recuperación:", innerError)
      }
    }

    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}

// Función auxiliar para obtener roles
async function obtenerRoles(includeInactive = false) {
  // Construir la condición where basada en si se incluyen inactivos o no
  const whereCondition = {
    // Siempre excluir roles borrados (con deletedAt)
    deletedAt: null,
  }

  // Si no se incluyen inactivos, filtrar por estado ACTIVO
  if (!includeInactive) {
    whereCondition.estadoRol = "ACTIVO"
  }

  console.log(`Obteniendo roles con condición:`, whereCondition)

  // Obtener roles con sus permisos
  const roles = await prisma.rol.findMany({
    where: whereCondition,
    include: {
      rolPermiso: {
        where: {
          deletedAt: null,
        },
        include: {
          permiso: {
            select: {
              idPermiso: true,
              nombrePermiso: true,
            },
          },
        },
      },
    },
    orderBy: {
      nombreRol: "asc",
    },
  })

  // Transformar los datos para una respuesta más limpia
  return roles.map((rol) => ({
    idRol: rol.idRol,
    nombreRol: rol.nombreRol,
    estadoRol: rol.estadoRol,
    permisos: rol.rolPermiso.map((rp) => ({
      idPermiso: rp.permiso.idPermiso,
      nombrePermiso: rp.permiso.nombrePermiso,
    })),
  }))
}

// POST /api/roles - Crear un nuevo rol
export async function POST(request) {
  try {
    console.log("API: Recibida solicitud para crear rol")
    const authController = new AuthController()
    const auditoriaService = new AuditoriaService()

    // Obtener el usuario autenticado para la auditoría
    let idUsuario = 1 // Valor por defecto para desarrollo
    let userData = null

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      userData = await authController.getUserFromToken(accessToken)
      if (userData) {
        idUsuario = userData.idUsuario
      }
    }

    // Verificar que el usuario tenga rol de administrador
    if (userData && userData.rol !== "ADMINISTRADOR" && userData.rol !== "ADMINISTRADOR_SISTEMA") {
      return NextResponse.json({ message: "No tienes permisos para crear roles" }, { status: 403 })
    }

    const datos = await request.json()
    console.log("API: Datos recibidos para crear rol:", datos)

    // Validar datos
    if (!datos.nombreRol) {
      return NextResponse.json({ error: "El nombre del rol es obligatorio" }, { status: 400 })
    }

    // Verificar si ya existe un rol con el mismo nombre
    const rolExistente = await prisma.rol.findFirst({
      where: {
        nombreRol: datos.nombreRol,
        deletedAt: null,
      },
    })

    if (rolExistente) {
      return NextResponse.json({ error: "Ya existe un rol con este nombre" }, { status: 400 })
    }

    // Crear el rol
    const rol = await prisma.rol.create({
      data: {
        nombreRol: datos.nombreRol,
        estadoRol: datos.estadoRol || "ACTIVO", // Por defecto, estado ACTIVO
      },
    })

    // Asignar permisos si se proporcionan
    if (datos.permisos && Array.isArray(datos.permisos) && datos.permisos.length > 0) {
      await Promise.all(
        datos.permisos.map(async (idPermiso) => {
          await prisma.rolPermiso.create({
            data: {
              idRol: rol.idRol,
              idPermiso: Number.parseInt(idPermiso),
            },
          })
        }),
      )
    }

    // Obtener el rol completo con sus permisos para la auditoría
    const rolCompleto = await prisma.rol.findUnique({
      where: {
        idRol: rol.idRol,
      },
      include: {
        rolPermiso: {
          include: {
            permiso: true,
          },
        },
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Rol", rol.idRol, rolCompleto, idUsuario, request)

    console.log("API: Rol creado con ID:", rol.idRol)
    return NextResponse.json(
      {
        mensaje: "Rol creado exitosamente",
        rol,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("API: Error al crear rol:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

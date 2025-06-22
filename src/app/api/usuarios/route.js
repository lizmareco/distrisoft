// Modificar las importaciones para incluir el servicio de auditoría
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { validatePasswordComplexity } from "../../../utils/passwordUtils"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"
import cookie from "cookie" 
const prisma = new PrismaClient()

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

// GET /api/usuarios - Obtener todos los usuarios
export async function GET(request) {
  try {
    console.log("API: Recibida solicitud para obtener usuarios")
    const { searchParams } = new URL(request.url)
    const nombreUsuario = searchParams.get("nombreUsuario")
    const persona = searchParams.get("persona")
    const rol = searchParams.get("rol")      // ID del rol
    const descripcionRol = searchParams.get("descripcionRol") // Nueva: descripción del rol (ej: "PRODUCCION")
    const estado = searchParams.get("estado")
    const all = searchParams.get("all") === "true"
    
    // Parámetros de paginación
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10)
    const validPage = page > 0 ? page : 1
    const validPageSize = pageSize > 0 && pageSize <= 100 ? pageSize : 10
    const skip = (validPage - 1) * validPageSize

    console.log(`API: Parámetros de paginación - Página: ${validPage}, Tamaño: ${validPageSize}, Skip: ${skip}`)

    // Si all=true, traer todos con paginación
    if (all) {
      // Obtener el total de registros para calcular el total de páginas
      const totalUsuarios = await prisma.usuario.count({
        where: { deletedAt: null },
      })

      const usuarios = await prisma.usuario.findMany({
        where: { deletedAt: null },
        include: {
          persona: { select: { nombre: true, apellido: true, nroDocumento: true } },
          rol: { select: { nombreRol: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: validPageSize,
      })

      // Calcular el total de páginas
      const totalPages = Math.ceil(totalUsuarios / validPageSize)

      return NextResponse.json({ 
        usuarios,
        pagination: {
          page: validPage,
          pageSize: validPageSize,
          totalItems: totalUsuarios,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        }
      }, { status: 200 })
    }

    // Si no hay filtros, devolver array vacío
    if (!nombreUsuario && !persona && !rol && !estado && !descripcionRol) {
      return NextResponse.json({ 
        usuarios: [],
        pagination: {
          page: 1,
          pageSize: validPageSize,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      }, { status: 200 })
    }

    // Construir condiciones de búsqueda
    const where = { deletedAt: null }
    if (nombreUsuario) where.nombreUsuario = { contains: nombreUsuario, mode: "insensitive" }
    if (rol) where.idRol = Number(rol)
    if (estado) where.estado = estado

    // Filtro de persona (nombre o apellido)
    let personaWhere = undefined
    if (persona) {
      personaWhere = {
        OR: [
          { nombre: { contains: persona, mode: "insensitive" } },
          { apellido: { contains: persona, mode: "insensitive" } },
        ],
      }
    }

    // Obtener el total de registros para calcular el total de páginas
    const totalUsuarios = await prisma.usuario.count({
      where,
    })

    // Buscar usuarios incluyendo el rol con paginación
    let usuarios = await prisma.usuario.findMany({
      where,
      include: {
        persona: { select: { nombre: true, apellido: true, nroDocumento: true } },
        rol: { select: { nombreRol: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: validPageSize,
    })

    // Filtrar por persona si corresponde
    if (persona) {
      const personaLower = persona.toLowerCase()
      usuarios = usuarios.filter(
        u =>
          u.persona &&
          (
            (u.persona.nombre && u.persona.nombre.toLowerCase().includes(personaLower)) ||
            (u.persona.apellido && u.persona.apellido.toLowerCase().includes(personaLower))
          )
      )
    }

    // Filtrar por descripciónRol ("PRODUCCION") en JS
    if (descripcionRol) {
      const descripcionRolLower = descripcionRol.toLowerCase()
      usuarios = usuarios.filter(
        u =>
          u.rol &&
          u.rol.nombreRol &&
          u.rol.nombreRol.toLowerCase() === descripcionRolLower
      )
    }

    // Calcular el total de páginas (ajustar después de filtros JS)
    const totalPages = Math.ceil(totalUsuarios / validPageSize)

    return NextResponse.json({ 
      usuarios,
      pagination: {
        page: validPage,
        pageSize: validPageSize,
        totalItems: totalUsuarios,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      }
    }, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener usuarios:", error)
    return NextResponse.json({ 
      usuarios: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      error: error.message 
    }, { status: 500 })
  }
}

// POST /api/usuarios - Crear un nuevo usuario
export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    const datos = await request.json()
    console.log("API: Recibida solicitud para crear usuario", datos)

    // Validar datos según el modelo Usuario correcto
    if (!datos.nombreUsuario || !datos.contrasena || !datos.idRol || !datos.idPersona || !datos.estado) {
      throw new Error("Faltan campos obligatorios: nombreUsuario, contrasena, idRol, idPersona o estado")
    }

    // Validar complejidad de la contraseña
    const passwordValidation = validatePasswordComplexity(datos.contrasena)
    if (!passwordValidation.isValid) {
      throw new Error(
        `La contraseña no cumple con los requisitos de seguridad: ${passwordValidation.errors.join(", ")}`,
      )
    }

    // Verificar si la persona existe
    const persona = await prisma.persona.findUnique({
      where: {
        idPersona: Number.parseInt(datos.idPersona),
        deletedAt: null,
      },
    })

    if (!persona) {
      throw new Error(`Persona con ID ${datos.idPersona} no encontrada`)
    }

    // Verificar si la persona ya tiene un usuario activo
    const usuariosExistentes = await prisma.usuario.findMany({
      where: {
        idPersona: Number.parseInt(datos.idPersona),
        estado: "ACTIVO",
        deletedAt: null,
      },
    })

    if (usuariosExistentes.length > 0) {
      throw new Error(
        `La persona ya tiene un usuario activo (${usuariosExistentes[0].nombreUsuario}) y no puede tener más`,
      )
    }

    // Encriptar la contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(datos.contrasena, saltRounds)
    console.log("API: Contraseña encriptada correctamente")

    // Crear el usuario con los campos correctos y la contraseña encriptada
    const usuario = await prisma.usuario.create({
      data: {
        nombreUsuario: datos.nombreUsuario,
        contrasena: hashedPassword, // Usar la contraseña encriptada
        idRol: Number.parseInt(datos.idRol),
        idPersona: Number.parseInt(datos.idPersona),
        estado: datos.estado || "ACTIVO",
        ultimoCambioContrasena: new Date(), // Establecer la fecha de último cambio de contraseña
      },
      include: {
        persona: true,
        rol: true,
      },
    })

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)
    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Usuario", idUsuario, usuario, idUsuario, direccionIP,
      navegador,)

    console.log("API: Usuario creado correctamente", usuario)
    return NextResponse.json(
      {
        mensaje: "Usuario creado exitosamente",
        usuario,
      },
      { status: HTTP_STATUS_CODES.created },
    )
  } catch (error) {
    console.error("API: Error al crear usuario:", error)
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
  }
}


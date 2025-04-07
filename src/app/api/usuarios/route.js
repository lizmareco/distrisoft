// Modificar las importaciones para incluir el servicio de auditoría
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { validatePasswordComplexity } from "../../../utils/passwordUtils"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

// GET /api/usuarios - Obtener todos los usuarios
export async function GET(request) {
  try {
    console.log("API: Recibida solicitud para obtener usuarios")
    const usuarios = await prisma.usuario.findMany({
      where: {
        deletedAt: null, // Solo excluimos los eliminados lógicamente
      },
      include: {
        persona: {
          select: {
            nombre: true,
            apellido: true,
            nroDocumento: true,
          },
        },
        rol: {
          select: {
            nombreRol: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log("DataSource: Usuarios encontrados:", usuarios.length)
    console.log("API: Usuarios obtenidos correctamente", { usuarios })
    return NextResponse.json({ usuarios }, { status: 200 })
  } catch (error) {
    console.error("API: Error al obtener usuarios:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/usuarios - Crear un nuevo usuario
export async function POST(request) {
  try {
    const auditoriaService = new AuditoriaService()
    const authController = new AuthController()

    // Obtener el usuario autenticado para la auditoría
    let idUsuario = 1 // Valor por defecto para desarrollo

    // Verificar si hay un usuario autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (accessToken) {
      const userData = await authController.getUserFromToken(accessToken)
      if (userData) {
        idUsuario = userData.idUsuario
      }
    }

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

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Usuario", usuario.idUsuario, usuario, idUsuario, request)

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


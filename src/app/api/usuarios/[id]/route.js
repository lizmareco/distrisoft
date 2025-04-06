import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { validatePasswordComplexity } from "../../../../utils/passwordUtils"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

// GET /api/usuarios/[id] - Obtener un usuario por ID
export async function GET(request, { params }) {
  try {
    // Asegurarse de que params.id esté disponible antes de usarlo
    const id = await params.id

    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        persona: true,
        rol: true,
      },
    })

    if (!usuario) {
      throw new Error(`Usuario con ID ${id} no encontrado`)
    }

    return NextResponse.json({ usuario }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.notFound })
  }
}

// PUT /api/usuarios/[id] - Actualizar un usuario
export async function PUT(request, { params }) {
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

    // Asegurarse de que params.id esté disponible antes de usarlo
    const id = await params.id

    const datos = await request.json()

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        idUsuario: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        persona: true,
        rol: true,
      },
    })

    if (!usuarioExistente) {
      throw new Error(`Usuario con ID ${id} no encontrado`)
    }

    // Si se está cambiando la persona, verificar límite de usuarios
    if (datos.idPersona && Number.parseInt(datos.idPersona) !== usuarioExistente.idPersona) {
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
    }

    // Preparar datos para actualizar
    const datosActualizados = {
      nombreUsuario: datos.nombreUsuario,
      idRol: Number.parseInt(datos.idRol),
      estado: datos.estado,
      updatedAt: new Date(),
    }

    // Solo actualizar la contraseña si se proporciona una nueva
    if (datos.contrasena) {
      // Validar complejidad de la contraseña
      const passwordValidation = validatePasswordComplexity(datos.contrasena)
      if (!passwordValidation.isValid) {
        throw new Error(
          `La contraseña no cumple con los requisitos de seguridad: ${passwordValidation.errors.join(", ")}`,
        )
      }

      // Encriptar la nueva contraseña
      const saltRounds = 10
      datosActualizados.contrasena = await bcrypt.hash(datos.contrasena, saltRounds)
      datosActualizados.ultimoCambioContrasena = new Date() // Actualizar fecha de último cambio
      console.log("API: Contraseña actualizada y encriptada correctamente")
    }

    // Solo actualizar idPersona si se proporciona
    if (datos.idPersona) {
      datosActualizados.idPersona = Number.parseInt(datos.idPersona)
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { idUsuario: Number.parseInt(id) },
      data: datosActualizados,
      include: {
        persona: true,
        rol: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarActualizacion(
      "Usuario",
      id,
      usuarioExistente,
      usuarioActualizado,
      idUsuario,
      request,
    )

    return NextResponse.json(
      {
        mensaje: "Usuario actualizado exitosamente",
        usuario: usuarioActualizado,
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
  }
}

// DELETE /api/usuarios/[id] - Eliminar un usuario
export async function DELETE(request, { params }) {
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

    // Asegurarse de que params.id esté disponible antes de usarlo
    const id = await params.id

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        idUsuario: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        persona: true,
        rol: true,
      },
    })

    if (!usuarioExistente) {
      throw new Error(`Usuario con ID ${id} no encontrado`)
    }

    // Realizar borrado lógico
    await prisma.usuario.update({
      where: { idUsuario: Number.parseInt(id) },
      data: {
        estado: "INACTIVO",
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarEliminacion("Usuario", id, usuarioExistente, idUsuario, request)

    return NextResponse.json(
      {
        mensaje: "Usuario eliminado exitosamente",
      },
      { status: HTTP_STATUS_CODES.ok },
    )
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: HTTP_STATUS_CODES.badRequest })
  }
}


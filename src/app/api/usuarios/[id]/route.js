import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { validatePasswordComplexity } from "../../../../utils/passwordUtils"

const prisma = new PrismaClient()

// GET /api/usuarios/[id] - Obtener un usuario por ID
export async function GET(request, { params }) {
  try {
    const { id } = params
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

    return NextResponse.json({ usuario }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}

// PUT /api/usuarios/[id] - Actualizar un usuario
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const datos = await request.json()

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        idUsuario: Number.parseInt(id),
        deletedAt: null,
      },
    })

    if (!usuarioExistente) {
      throw new Error(`Usuario con ID ${id} no encontrado`)
    }

    // Si se está cambiando la persona, verificar límite de usuarios
    if (datos.idPersona && datos.idPersona !== usuarioExistente.idPersona) {
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

      // Modificar la verificación del límite de usuarios
      // Verificar si la persona ya tiene un usuario
      const cantidadUsuarios = await prisma.usuario.count({
        where: {
          idPersona: Number.parseInt(datos.idPersona),
          estado: {
            not: "INACTIVO",
          },
          deletedAt: null,
        },
      })

      if (cantidadUsuarios >= 1) {
        throw new Error(`La persona ya tiene un usuario activo y no puede tener más`)
      }
    }

    // Preparar datos para actualizar
    const datosActualizados = {
      nombreUsuario: datos.nombreUsuario,
      idRol: Number.parseInt(datos.idRol),
      estado: datos.estado,
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
      console.log("API: Contraseña actualizada y encriptada correctamente")
    }

    // Solo actualizar idPersona si se proporciona
    if (datos.idPersona) {
      datosActualizados.idPersona = Number.parseInt(datos.idPersona)
    }

    const usuario = await prisma.usuario.update({
      where: { idUsuario: Number.parseInt(id) },
      data: datosActualizados,
      include: {
        persona: true,
        rol: true,
      },
    })

    return NextResponse.json(
      {
        mensaje: "Usuario actualizado exitosamente",
        usuario,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

// DELETE /api/usuarios/[id] - Eliminar un usuario
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Verificar si el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        idUsuario: Number.parseInt(id),
        deletedAt: null,
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

    return NextResponse.json(
      {
        mensaje: "Usuario eliminado exitosamente",
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}


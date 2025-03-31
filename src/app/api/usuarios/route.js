import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { validatePasswordComplexity } from "../../../utils/passwordUtils"

const prisma = new PrismaClient()

// GET /api/usuarios - Obtener todos los usuarios
export async function GET() {
  try {
    console.log("API: Recibida solicitud para obtener usuarios")
    const usuarios = await prisma.usuario.findMany({
      where: {
        estado: {
          not: "INACTIVO",
        },
        deletedAt: null,
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
      },
      include: {
        persona: true,
        rol: true,
      },
    })

    console.log("API: Usuario creado correctamente", usuario)
    return NextResponse.json(
      {
        mensaje: "Usuario creado exitosamente",
        usuario,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("API: Error al crear usuario:", error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}


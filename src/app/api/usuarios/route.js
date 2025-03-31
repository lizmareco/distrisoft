import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

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

    // Verificar si la persona ya tiene dos usuarios
    const cantidadUsuarios = await prisma.usuario.count({
      where: {
        idPersona: Number.parseInt(datos.idPersona),
        estado: {
          not: "INACTIVO",
        },
        deletedAt: null,
      },
    })

    if (cantidadUsuarios >= 2) {
      throw new Error(`La persona ya tiene el máximo de 2 usuarios permitidos`)
    }

    // Crear el usuario con los campos correctos
    const usuario = await prisma.usuario.create({
      data: {
        nombreUsuario: datos.nombreUsuario,
        contrasena: datos.contrasena, // Nota: En producción, deberías hashear esta contraseña
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


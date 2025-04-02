import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const usuarioDataSource = {
  // Obtener todos los usuarios
  obtenerUsuarios: async () => {
    try {
      console.log("DataSource: Consultando usuarios en la base de datos")
      const usuarios = await prisma.usuario.findMany({
        where: {
          deletedAt: null, // Solo usuarios no eliminados lógicamente
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
              nombreRol: true, // Cambiado de nombre a nombreRol
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      console.log("DataSource: Usuarios encontrados:", usuarios.length)
      return usuarios
    } catch (error) {
      console.error("Error al obtener usuarios en datasource:", error)
      throw new Error("No se pudieron obtener los usuarios: " + (error.message || "Error de base de datos"))
    }
  },

  // Obtener un usuario por ID
  obtenerUsuarioPorId: async (id) => {
    try {
      return await prisma.usuario.findUnique({
        where: {
          idUsuario: Number.parseInt(id),
          deletedAt: null,
        },
        include: {
          persona: true,
          rol: true,
        },
      })
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error)
      throw new Error(`No se pudo encontrar el usuario con ID ${id}`)
    }
  },

  // Verificar si una persona ya tiene un usuario activo
  verificarLimiteUsuarios: async (personaId) => {
    try {
      const cantidadUsuarios = await prisma.usuario.count({
        where: {
          idPersona: Number.parseInt(personaId),
          estado: "ACTIVO",
          deletedAt: null,
        },
      })
      return cantidadUsuarios >= 1
    } catch (error) {
      console.error(`Error al verificar límite de usuarios para persona ${personaId}:`, error)
      throw new Error("Error al verificar límite de usuarios")
    }
  },

  // Crear un nuevo usuario
  crearUsuario: async (datos) => {
    try {
      return await prisma.usuario.create({
        data: datos,
        include: {
          persona: true,
          rol: true,
        },
      })
    } catch (error) {
      console.error("Error al crear usuario:", error)
      throw new Error("No se pudo crear el usuario")
    }
  },

  // Actualizar un usuario existente
  actualizarUsuario: async (id, datos) => {
    try {
      return await prisma.usuario.update({
        where: { idUsuario: Number.parseInt(id) },
        data: datos,
        include: {
          persona: true,
          rol: true,
        },
      })
    } catch (error) {
      console.error(`Error al actualizar usuario con ID ${id}:`, error)
      throw new Error(`No se pudo actualizar el usuario con ID ${id}`)
    }
  },

  // Eliminar un usuario (borrado lógico)
  eliminarUsuario: async (id) => {
    try {
      return await prisma.usuario.update({
        where: { idUsuario: Number.parseInt(id) },
        data: {
          estado: "INACTIVO",
          deletedAt: new Date(),
        },
      })
    } catch (error) {
      console.error(`Error al eliminar usuario con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar el usuario con ID ${id}`)
    }
  },

  // Eliminar un usuario permanentemente
  eliminarUsuarioPermanente: async (id) => {
    try {
      return await prisma.usuario.delete({
        where: { idUsuario: Number.parseInt(id) },
      })
    } catch (error) {
      console.error(`Error al eliminar permanentemente usuario con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar permanentemente el usuario con ID ${id}`)
    }
  },
}


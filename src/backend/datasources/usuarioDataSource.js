import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const usuarioDataSource = {
  // Obtener todos los usuarios
  obtenerUsuarios: async () => {
    try {
      return await prisma.usuario.findMany({
        orderBy: {
          nombreUsuario: "asc",
        },
      })
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
      throw new Error("No se pudieron obtener los usuarios")
    }
  },

  // Obtener un usuario por ID
  obtenerUsuarioPorId: async (id) => {
    try {
      return await prisma.usuario.findUnique({
        where: { id: Number.parseInt(id) },
      })
    } catch (error) {
      console.error(`Error al obtener usuario con ID ${id}:`, error)
      throw new Error(`No se pudo encontrar el usuario con ID ${id}`)
    }
  },

  // Crear un nuevo usuario
  crearUsuario: async (datos) => {
    try {
      return await prisma.usuario.create({
        data: datos,
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
        where: { id: Number.parseInt(id) },
        data: datos,
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
        where: { id: Number.parseInt(id) },
        data: { activo: false },
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
        where: { id: Number.parseInt(id) },
      })
    } catch (error) {
      console.error(`Error al eliminar permanentemente usuario con ID ${id}:`, error)
      throw new Error(`No se pudo eliminar permanentemente el usuario con ID ${id}`)
    }
  },
}


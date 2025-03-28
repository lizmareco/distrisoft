import { usuarioDataSource } from "../datasources/usuarioDataSource"

export const usuarioController = {
  // Obtener todos los usuarios
  obtenerUsuarios: async (req, res) => {
    try {
      const usuarios = await usuarioDataSource.obtenerUsuarios()
      return { usuarios }
    } catch (error) {
      console.error("Error en el controlador al obtener usuarios:", error)
      throw new Error("Error al obtener usuarios")
    }
  },

  // Obtener un usuario por ID
  obtenerUsuarioPorId: async (id) => {
    try {
      const usuario = await usuarioDataSource.obtenerUsuarioPorId(id)
      if (!usuario) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }
      return { usuario }
    } catch (error) {
      console.error(`Error en el controlador al obtener usuario con ID ${id}:`, error)
      throw new Error(`Error al obtener usuario con ID ${id}`)
    }
  },

  // Crear un nuevo usuario
  crearUsuario: async (datos) => {
    try {
      // Validar datos
      if (!datos.nombre || !datos.apellido || !datos.email || !datos.password) {
        throw new Error("Faltan campos obligatorios")
      }

      const usuario = await usuarioDataSource.crearUsuario(datos)
      return {
        mensaje: "Usuario creado exitosamente",
        usuario,
      }
    } catch (error) {
      console.error("Error en el controlador al crear usuario:", error)
      throw new Error(`Error al crear usuario: ${error.message}`)
    }
  },

  // Actualizar un usuario existente
  actualizarUsuario: async (id, datos) => {
    try {
      // Verificar si el usuario existe
      const usuarioExistente = await usuarioDataSource.obtenerUsuarioPorId(id)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      const usuario = await usuarioDataSource.actualizarUsuario(id, datos)
      return {
        mensaje: "Usuario actualizado exitosamente",
        usuario,
      }
    } catch (error) {
      console.error(`Error en el controlador al actualizar usuario con ID ${id}:`, error)
      throw new Error(`Error al actualizar usuario: ${error.message}`)
    }
  },

  // Eliminar un usuario (borrado lógico)
  eliminarUsuario: async (id) => {
    try {
      // Verificar si el usuario existe
      const usuarioExistente = await usuarioDataSource.obtenerUsuarioPorId(id)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${id} no encontrado`)
      }

      await usuarioDataSource.eliminarUsuario(id)
      return {
        mensaje: "Usuario eliminado exitosamente",
      }
    } catch (error) {
      console.error(`Error en el controlador al eliminar usuario con ID ${id}:`, error)
      throw new Error(`Error al eliminar usuario: ${error.message}`)
    }
  },
}


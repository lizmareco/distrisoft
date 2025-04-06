import { usuarioDataSource } from "../datasources/usuarioDataSource"
import { personaController } from "./personaController"


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
      if (!datos.nombreUsuario || !datos.contrasena || !datos.idPersona || !datos.idRol) {
        throw new Error("Faltan campos obligatorios")
      }

      // Verificar si la persona existe
      const { persona } = await personaController.obtenerPersonaPorId(datos.idPersona)
      if (!persona) {
        throw new Error(`Persona con ID ${datos.idPersona} no encontrada`)
      }

      // Verificar si la persona ya tiene dos usuarios
      const tieneMaximoUsuarios = await usuarioDataSource.verificarLimiteUsuarios(datos.idPersona)
      if (tieneMaximoUsuarios) {
        throw new Error(`La persona ya tiene el máximo de 2 usuarios permitidos`)
      }

      // Asegurar que el estado sea ACTIVO por defecto
      if (!datos.estado) {
        datos.estado = "ACTIVO"
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

      // Si se está cambiando la persona, verificar límite de usuarios
      if (datos.idPersona && datos.idPersona !== usuarioExistente.idPersona) {
        // Verificar si la persona existe
        const { persona } = await personaController.obtenerPersonaPorId(datos.idPersona)
        if (!persona) {
          throw new Error(`Persona con ID ${datos.idPersona} no encontrada`)
        }

        // Verificar si la persona ya tiene dos usuarios
        const tieneMaximoUsuarios = await usuarioDataSource.verificarLimiteUsuarios(datos.idPersona)
        if (tieneMaximoUsuarios) {
          throw new Error(`La persona ya tiene el máximo de 2 usuarios permitidos`)
        }
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
  /**
   * Actualiza la contraseña de un usuario
   * @param {number} idUsuario - ID del usuario
   * @param {string} nuevaContrasena - Nueva contraseña (ya hasheada)
   * @returns {Object} Usuario actualizado
   */
  actualizarContrasena: async (idUsuario, nuevaContrasena) => {
    try {
      // Verificar si el usuario existe
      const usuarioExistente = await usuarioDataSource.obtenerUsuarioPorId(idUsuario)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${idUsuario} no encontrado`)
      }

      const usuario = await usuarioDataSource.actualizarUsuario(idUsuario, {
        contrasena: nuevaContrasena,
        updatedAt: new Date()
      })

      return {
        mensaje: "Contraseña actualizada exitosamente",
        usuario
      }
    } catch (error) {
      console.error('Error al actualizar contraseña:', error)
      throw new Error(`Error al actualizar contraseña: ${error.message}`)
    }
  },

  /**
   * Actualiza la fecha de último cambio de contraseña
   * @param {number} idUsuario - ID del usuario
   * @returns {Object} Usuario actualizado
   */
  actualizarUltimoCambioContrasena: async (idUsuario) => {
    try {
      // Verificar si el usuario existe
      const usuarioExistente = await usuarioDataSource.obtenerUsuarioPorId(idUsuario)
      if (!usuarioExistente) {
        throw new Error(`Usuario con ID ${idUsuario} no encontrado`)
      }

      const usuario = await usuarioDataSource.actualizarUsuario(idUsuario, {
        ultimoCambioContrasena: new Date(),
        updatedAt: new Date()
      })

      return {
        mensaje: "Fecha de cambio de contraseña actualizada",
        usuario
      }
    } catch (error) {
      console.error('Error al actualizar fecha de cambio de contraseña:', error)
      throw new Error(`Error al actualizar fecha: ${error.message}`)
    }
  }
}


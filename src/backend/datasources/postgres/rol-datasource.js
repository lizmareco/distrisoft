import BaseDatasource from "../base-datasource";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default class RolDatasource extends BaseDatasource {
  constructor() {
    // Se inyecta el modelo "rol" y se especifica que el campo identificador es "idRol"
    super(prisma.Rol, 'idRol');
  }

  async getAllRoles() {
    try {
      return await this.model.findMany({
        where: {
          deletedAt: null
        },
        include: {
          // Se incluye la relación para obtener los permisos asignados al rol
          rolPermiso: {
            include: {
              permiso: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error al obtener los roles:", error);
      throw new Error("No se pudieron recuperar los roles.");
    }
  }

  async getRole(id) {
    try {
      return await this.model.findUnique({
        where: {
          [this.primaryKey]: id
        },
        include: {
          rolPermiso: {
            include: {
              permiso: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error al obtener el rol:", error);
      throw new Error("No se pudo obtener el rol.");
    }
  }

  /**
   * Crea un nuevo rol y, opcionalmente, asigna permisos existentes.
   * @param {Object} data - Datos del rol (por ejemplo, { nombreRol: 'Admin' }).
   * @param {number[]} permissionIds - Arreglo de IDs de permisos a asignar.
   */
  async createRole(data, permissionIds = []) {
    try {
      return await this.model.create({
        data: {
          ...data,
          deletedAt: null, // Se asegura que el rol se crea como activo.
          // Si se proporcionan IDs de permisos, se crea la relación en la tabla intermedia
          rolPermiso: permissionIds.length > 0 ? {
            create: permissionIds.map(permId => ({
              permiso: {
                connect: { idPermiso: permId }
              }
            }))
          } : undefined
        },
        include: {
          rolPermiso: {
            include: {
              permiso: true
            }
          }
        }
      });
    } catch (error) {
      console.error("Error al crear el rol:", error);
      throw new Error("No se pudo crear el rol.");
    }
  }

  async updateRole(id, data) {
    try {
      return await this.model.update({
        where: {
          [this.primaryKey]: id // Uso del campo identificador dinámico (idRol)
        },
        data: {
          ...data,
          updatedAt: new Date() // Actualiza el timestamp de modificación
        }
      });
    } catch (error) {
      console.error("Error al actualizar el rol:", error);
      throw new Error("No se pudo actualizar el rol.");
    }
  }

  async deleteRole(id) {
    try {
      return await this.model.update({
        where: {
          [this.primaryKey]: id
        },
        data: {
          deletedAt: new Date() // Se marca el rol como eliminado (soft delete)
        }
      });
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      throw new Error("No se pudo eliminar el rol.");
    }
  }

  /**
   * Asigna un permiso existente a un rol, creando la relación en el modelo RolPermiso.
   * @param {number} roleId - ID del rol.
   * @param {number} permissionId - ID del permiso a asignar.
   */
  async assignPermissionToRole(roleId, permissionId) {
    try {
      return await prisma.rolPermiso.create({
        data: {
          idRol: roleId,
          idPermiso: permissionId,
          deletedAt: null // Se marca la relación como activa
        }
      });
    } catch (error) {
      console.error("Error al asignar el permiso al rol:", error);
      throw new Error("No se pudo asignar el permiso al rol.");
    }
  }

  /**
   * Remueve un permiso asignado a un rol. Se realiza un soft delete en la relación.
   * IMPORTANTE: La clave para identificar la relación en la tabla intermedia
   * depende de cómo esté definida. Se asume que se usa una clave compuesta.
   * @param {number} roleId - ID del rol.
   * @param {number} permissionId - ID del permiso a remover.
   */
  async removePermissionFromRole(roleId, permissionId) {
    try {
      return await prisma.rolPermiso.update({
        where: {
          idRol_idPermiso: { idRol: roleId, idPermiso: permissionId }
        },
        data: {
          deletedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Error al remover el permiso del rol:", error);
      throw new Error("No se pudo remover el permiso del rol.");
    }
  }
}

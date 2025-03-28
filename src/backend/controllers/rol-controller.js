import RolDatasource from "@/src/backend/datasources/postgres/rol-datasource";

export default class RolController {
  constructor() {
    this.rolDatasource = new RolDatasource();
  }

  async getAllRoles() {
    try {
      return await this.rolDatasource.getAllRoles();
    } catch (error) {
      console.error("Error al obtener roles:", error);
      throw new Error("Error al obtener roles.");
    }
  }

  async getRole(id) {
    try {
      return await this.rolDatasource.getRole(id);
    } catch (error) {
      console.error("Error al obtener el rol:", error);
      throw new Error("Error al obtener el rol.");
    }
  }

  async createRole(roleData, permissionIds = []) {
    try {
      return await this.rolDatasource.createRole(roleData, permissionIds);
    } catch (error) {
      console.error("Error al crear rol:", error);
      throw new Error("Error al crear rol.");
    }
  }

  async updateRole(id, roleData) {
    try {
      return await this.rolDatasource.updateRole(id, roleData);
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      throw new Error("Error al actualizar rol.");
    }
  }

  async deleteRole(id) {
    try {
      return await this.rolDatasource.deleteRole(id);
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      throw new Error("Error al eliminar rol.");
    }
  }

  async assignPermission(roleId, permissionId) {
    try {
      return await this.rolDatasource.assignPermissionToRole(roleId, permissionId);
    } catch (error) {
      console.error("Error al asignar permiso:", error);
      throw new Error("Error al asignar permiso.");
    }
  }

  async removePermission(roleId, permissionId) {
    try {
      return await this.rolDatasource.removePermissionFromRole(roleId, permissionId);
    } catch (error) {
      console.error("Error al remover permiso:", error);
      throw new Error("Error al remover permiso.");
    }
  }
}

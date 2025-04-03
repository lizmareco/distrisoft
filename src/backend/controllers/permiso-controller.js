import PermisoDatasource from "@/src/backend/datasources/postgres/permiso-datasource";

export default class PermisoController {
    constructor() {
        this.permisoDatasource = new PermisoDatasource();
    }

    async getAllPermisos() {
        try {
            const permisos = await this.permisoDatasource.getAllPermisos();
            return permisos;
        } catch (error) {
            console.error("Error en listarTodos:", error);
            throw new Error("Error al obtener los permisos.");
        }
    }
}

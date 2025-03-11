import PermisoDatasource from "../datasources/permiso-datasource";

export default class PermisoController {
    constructor() {
        this.permisoDatasource = new PermisoDatasource();
    }

    async listarTodos(req, res) {
        try {
            const permisos = await this.permisoDatasource.listarTodos();
            return res.status(200).json(permisos);
        } catch (error) {
            console.error("Error en listarTodos:", error);
            return res.status(500).json({ message: "Error al obtener los permisos." });
        }
    }
}

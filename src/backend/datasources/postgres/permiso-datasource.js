import BaseDatasource from "../base-datasource";
import { prisma } from "@/prisma/client";

export default class PermisoDatasource extends BaseDatasource {
    constructor() {
      super(prisma.permiso);
}

async getAllPermisos() {
    try {
        return await prisma.permiso.findMany({
            where: {
                deletedAt: null
            }
        });
    } catch (error) {
        console.error("Error al obtener los permisos:", error);
        throw new Error("No se pudieron recuperar los permisos.");
    }
}

}
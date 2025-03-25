import BaseDatasource from "../base-datasource";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default class PermisoDatasource extends BaseDatasource {
    constructor() {
        super(prisma.permiso); // modelo "Permiso" en schema.prisma → prisma.permiso en código JS
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

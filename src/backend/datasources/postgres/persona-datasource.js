import BaseDatasource from "../base-datasource";
import { prisma } from "@/prisma/client";

export default class PersonaDatasource extends BaseDatasource {
  constructor() {
    super(prisma.persona);
  }

  obtenerPersonaConCorreo(correoPersona) {
    return prisma.persona.findUnique({
      where: {
        correoPersona,
        deletedAt: null
      },
      include: {
        usuario: true
      }
    });
  }
}
import BaseDatasource from '@/src/backend/datasources/base-datasource';
import { prisma } from '@/prisma/client';

export default class PersonaDatasource extends BaseDatasource {
  constructor() {
    super(prisma.persona);
  }

  obtenerPersonaConCorreo(correoPersona) {
    return prisma.persona.findFirst({
      where: {
        correoPersona,
        deletedAt: null
      },
      include: {
        usuario: {
          include: {
            rol: {
              include: {
                rolPermiso: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}
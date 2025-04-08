import RefreshTokenDatasource from '@/src/backend/datasources/postgres/refreshtoken-datasource';
// import { ImageController } from '@/src/backend/controller/controllers';
import { JWT_SECRET, JWT_SECRET_EXPIRE } from '@/settings';
import BaseController from './base-controller';
import jwt from 'jsonwebtoken';


export default class RefreshController extends BaseController {
  constructor() {
    super(new RefreshTokenDatasource());
    this.accessTokenDatasource = new RefreshTokenDatasource()
  }


  async create(persona, acessToken) {
    try {
      const data = {
        idUsuario: persona.usuario[0].idUsuario,
      }

      const refreshToken = await jwt.sign(data, JWT_SECRET, { expiresIn: JWT_SECRET_EXPIRE });
      return super.create({
        refreshToken,
        accessToken: {
          connect: {
            idAccessToken: acessToken.idAccessToken
          }
        },
        usuario: {
          connect: {
            idUsuario: persona.usuario[0].idUsuario
          }
        }
      });
    } catch(err) {
      console.log('Error in  access token controller (create): ', err);
      return null;
    }
  }


  // async invalidate(id) {
  //   try {
  //     return this.accessTokenDatasource.delete(id);
  //   }catch(error) {
  //     console.log('Error invalidating token (not important): ', error);
  //     return null;
  //   }
  // }


  // async invalidateTokens(userId, whiteList) {
  //   try {
  //     return this.accessTokenDatasource.invalidateTokens(userId, whiteList);
  //   }catch(error) {
  //     console.log('Invalidate many tokens error: ', error);
  //     return null;
  //   }
  // }


  async isValid(accessToken) {
    try {
      const decodedToken = jwt.verify(accessToken, JWT_SECRET);
  
      if (decodedToken.exp < Date.now() / 1000) {
        return false;
      }
  
      if(jwt.verify(accessToken, process.env.JWT_SECRET)) {
        const tokenList = await this.getAll({
          where: {
            accessToken
          }
        });
        
        return tokenList.length > 0;
      }
      return false;
    }catch(error) {
      return false;
    }
  }
  /**
   * Invalida todos los tokens de refresco de un usuario
   * @param {number} idUsuario - ID del usuario
   * @returns {Object} Resultado de la operación
   */
  async invalidateAllForUser(idUsuario) {
    try {
      const result = await prisma.refreshToken.updateMany({
        where: {
          idUsuario: idUsuario,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });

      return result;
    } catch (error) {
      console.error('Error al invalidar tokens de refresco:', error);
      throw new CustomError('Error al invalidar tokens', HTTP_STATUS_CODES.internalServerError);
    }
  }
}
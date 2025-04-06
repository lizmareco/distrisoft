import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import CustomError from '@/src/lib/errors/custom-errors';
import { HTTP_STATUS_CODES } from '@/src/lib/http/http-status-code';

const prisma = new PrismaClient();

export default class RecoveryTokenController {
  /**
   * Crea un nuevo token de recuperación para un usuario
   * @param {Object} usuario - El usuario para el que se crea el token
   * @returns {Object} El token creado
   */
  async create(usuario) {
    try {
      // Generar token aleatorio
      const token = crypto.randomBytes(32).toString('hex');
      const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Invalidar tokens anteriores
      await prisma.recuperacionContrasena.updateMany({
        where: {
          idUsuario: usuario.idUsuario,
          usado: false
        },
        data: {
          usado: true,
          updatedAt: new Date()
        }
      });

      // Crear nuevo token
      const recoveryToken = await prisma.recuperacionContrasena.create({
        data: {
          token,
          expiracion,
          idUsuario: usuario.idUsuario,
          usado: false
        }
      });

      return recoveryToken;
    } catch (error) {
      console.error('Error al crear token de recuperación:', error);
      throw new CustomError('Error al crear token de recuperación', HTTP_STATUS_CODES.internalServerError);
    }
  }

  /**
   * Verifica si un token es válido y no ha expirado
   * @param {string} token - El token a verificar
   * @returns {Object|null} El registro de recuperación si es válido, null en caso contrario
   */
  async verify(token) {
    try {
      const recoveryToken = await prisma.recuperacionContrasena.findFirst({
        where: {
          token,
          usado: false,
          expiracion: {
            gt: new Date()
          }
        },
        include: {
          usuario: {
            include: {
              persona: true
            }
          }
        }
      });

      return recoveryToken;
    } catch (error) {
      console.error('Error al verificar token de recuperación:', error);
      throw new CustomError('Error al verificar token', HTTP_STATUS_CODES.internalServerError);
    }
  }

  /**
   * Marca un token como usado
   * @param {string} token - El token a invalidar
   * @returns {Object} El token actualizado
   */
  async invalidate(token) {
    try {
      const updatedToken = await prisma.recuperacionContrasena.updateMany({
        where: {
          token
        },
        data: {
          usado: true,
          updatedAt: new Date()
        }
      });

      return updatedToken;
    } catch (error) {
      console.error('Error al invalidar token de recuperación:', error);
      throw new CustomError('Error al invalidar token', HTTP_STATUS_CODES.internalServerError);
    }
  }

  /**
   * Obtiene el usuario asociado a un token
   * @param {string} token - El token de recuperación
   * @returns {Object|null} El usuario asociado al token
   */
  async getUser(token) {
    try {
      const recoveryToken = await this.verify(token);
      
      if (!recoveryToken) {
        return null;
      }

      return recoveryToken.usuario;
    } catch (error) {
      console.error('Error al obtener usuario por token de recuperación:', error);
      throw new CustomError('Error al obtener usuario', HTTP_STATUS_CODES.internalServerError);
    }
  }

  /**
   * Invalida todos los tokens de recuperación de un usuario
   * @param {number} idUsuario - ID del usuario
   * @returns {Object} Resultado de la operación
   */
  async invalidateAllForUser(idUsuario) {
    try {
      const result = await prisma.recuperacionContrasena.updateMany({
        where: {
          idUsuario,
          usado: false
        },
        data: {
          usado: true,
          updatedAt: new Date()
        }
      });

      return result;
    } catch (error) {
      console.error('Error al invalidar tokens de recuperación del usuario:', error);
      throw new CustomError('Error al invalidar tokens', HTTP_STATUS_CODES.internalServerError);
    }
  }

  /**
   * Elimina tokens de recuperación expirados
   * @returns {number} Número de tokens eliminados
   */
  async cleanupExpiredTokens() {
    try {
      const result = await prisma.recuperacionContrasena.updateMany({
        where: {
          expiracion: {
            lt: new Date()
          },
          usado: false
        },
        data: {
          usado: true,
          updatedAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error al limpiar tokens expirados:', error);
      throw new CustomError('Error al limpiar tokens', HTTP_STATUS_CODES.internalServerError);
    }
  }
}
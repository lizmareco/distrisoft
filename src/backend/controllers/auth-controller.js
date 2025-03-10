import AccessTokenController from '@/src/backend/controllers/access-controller';
import UsuarioController from '@/src/backend/controllers/usuario-controller';
import PersonaController from '@/src/backend/controllers/persona-controller';
import { HTTP_STATUS_CODES } from '@/src/lib/http/http-status-code';
import CustomError from '@/src/lib/errors/custom-errors';
// import RefreshTokenController from '@/src/backend/controllers/refresh-token-controller';
  
export default class AuthController {
  constructor() {
    this.usuarioController = new UsuarioController();
    this.accessTokenController = new AccessTokenController();
    this.personaController = new PersonaController();
    // this.refreshTokenController = new RefreshTokenController();
    // this.recoveryTokenController = new RecoveryTokenController();
  }


  /**
   * @param {Object} data
   * @returns {String} token 
   */
  // async register(data) {
  //   try{
  //     const emailTokenVerificationController = new EmailTokenVerificationController();
  //     const phoneCodeVerificationController = new PhoneCodeVerificationController();
  //     const userDTO = await UserDTO.create(data);
  //     const user = await this.userController.create(userDTO);
      
  //     if(user) { 
  //       const accessToken =  await this.accessTokenController.create(user, '/profiles/default.png');
  //       const promises = [
  //         this.refreshTokenController.create(user, accessToken.id),
  //         emailTokenVerificationController.create(user),
  //         phoneCodeVerificationController.create(user)
  //       ]
  //       const [refreshToken, emailToken, phoneCode] = await Promise.all(promises);
        
  //       if(emailToken) {
  //         console.log('El correo de verificacion fue enviado');
  //       }
  //       if(phoneCode) {
  //         console.log('El código de verificación fue enviado');
  //       }

  //       return {
  //         accessToken: accessToken.accessToken,
  //         refreshToken: refreshToken.refreshToken
  //       };
  //     };

  //     throw new Error('No se ha podido registrar');
  //   }catch(e) {
  //     console.log('Error registering: ', e);
  //     if(e.code === 'P2002') return {
  //       error: true,
  //       errorCode: e.meta.target
  //     };
  //     throw CustomError('No se ha podido registrar', HTTP_STATUS_CODES.internalServerError);
  //   }
  // }


  async login(data) {
    try {
      const persona = await this.personaController.obtenerPersonaConCorreo(data.email);
      
      console.log('persona: ', persona);
      
    } catch(error) {
      if(error.isCustom) {
        throw new CustomError(error.message, error.status);
      } else {
        console.log('Error in authController.login: ', JSON.stringify(error, null, 2));
        throw error;
      }
    }
  }


  // async changePassword(userId, data) {
  //   if(!userId) throw new CustomError('No se ha proporcionado un usuario', HTTP_STATUS_CODES.badRequest);

  //   const user = await this.userController.get(userId);
  //   const saltOrRound = process.env.SALT_ROUND;
  //   const password = await hash(data.newPassword, parseInt(saltOrRound));

  //   if(data.hasOwnProperty('actualPassword') && data.hasOwnProperty('newPassword')) {
  //     if(await compare(data.actualPassword, user.password)) {  
  //       const updatedUser = await this.userController.update(userId, {
  //         password: password
  //       });
        
  //       return updatedUser;
  //     }
  //   }else if(data.hasOwnProperty('confirmPassword') && data.hasOwnProperty('newPassword')) {
  //     if(data.newPassword === data.confirmPassword) {
  //       const updatedUser = await this.userController.update(userId, {
  //         password: password
  //       });

  //       return updatedUser;
  //     }
  //   }

  //   return null;
  // }


  // async refreshToken(oldTokens) {
  //   try {
  //     const user = await this.refreshTokenController.getUser(oldTokens.refreshToken);
  //     // create new tokens
  //     const accessToken = await this.accessTokenController.create(user)
  //     const tokensPromises = [
  //       this.refreshTokenController.create(user, accessToken.id),
  //       this.refreshTokenController.getByRefreshToken(oldTokens.refreshToken)
  //     ]
  //     const [refreshToken, refreshTokenData] = await Promise.all(tokensPromises);

  //     // delete old tokens
  //     const deletePromises = [
  //       this.accessTokenController.invalidate(refreshTokenData.accessToken.id),
  //       this.refreshTokenController.invalidate(refreshTokenData.id)
  //     ]
  //     await Promise.allSettled(deletePromises);

  //     return { accessToken: accessToken.accessToken, refreshToken: refreshToken.refreshToken }
  //   }catch(error) {
  //     console.error('❌ error refreshing token: ', JSON.stringify(error, null, 2));
  //     return null;
  //   }
  // }


  async requestResetPassword(data) {
    const user = await this.userController.getByEmail(data.email);

    if(user) {
      const EXPIRE_IN = '1d';
      const refreshToken = await this.recoveryTokenController.create(user, EXPIRE_IN);
    
      return resetPasswordMail('ChambeApp, recuperación de contraseña', user.email, refreshToken.recoveryToken);
    } else {
      throw new CustomError('No se ha encontrado el usuario', HTTP_STATUS_CODES.notFound);
    }
  }


  /**
   * Thsi method is used to reset the password of a user, return the new tokens
   * @param {string} resetToken 
   * @param {Object} data 
   * @returns {{accessToken: string, refreshToken: string}}
   */
  async resetPassword(resetToken, data) {
    try {
      const TOKEN_TIME_VALID = '1d';
      const user = await this.recoveryTokenController.getUser(resetToken);
      if(!user) return null;
  
      const updatedUser = await this.changePassword(user.id, data);
      if(!updatedUser) return null;
  
      const accessToken = await this.accessTokenController.create(user);
      const tokensPromises = [
        this.refreshTokenController.create(user, accessToken.id),
        this.recoveryTokenController.create(user, TOKEN_TIME_VALID),
        this.recoveryTokenController.invalidate(resetToken)
      ]
      const [refreshToken, recoveryToken] = await Promise.all(tokensPromises);
      
      // ! need implementation
      // notificate password has been changed
      // await newLoginMail(data.email, {
      //   name: user.name,
      //   os: browserData.os,
      //   browser: browserData.browser,
      //   recoveryToken: recoveryToken.recoveryToken
      // });

      return { accessToken: accessToken.accessToken, refreshToken: refreshToken.refreshToken };
    } catch(error) {
      console.error(JSON.stringify(error, null, 2));
    }
  }


  /**
   * @param {*} request 
   * @returns { string | null } return accessToken or null
   */
  async hasAccessToken(request) {
    try {
      const accessTokenCookie = request.cookies.get('at');
      const accessToken = accessTokenCookie?.value;
      
      const isValid = await this.accessTokenController.isValid(accessToken);
      if(isValid) {
        return accessToken;
      }

      return null;
    } catch(error) {
      console.error('❌ Error in isLogged: ', JSON.stringify(error, null, 2));
      return false;
    }
  }


  async verifyAccessToken(aToken, rToken) {
    if(aToken) return { accessToken: aToken };
    if(rToken) {
      return this.refreshToken({ refreshToken: rToken });
    }

    return null;
  }
}
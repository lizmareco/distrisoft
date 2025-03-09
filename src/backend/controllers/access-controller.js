import { AccessTokenDatasource } from '@/src/backend/datasource/datasources';
// import { ImageController } from '@/src/backend/controller/controllers';
import { JWT_SECRET, JWT_SECRET_EXPIRE } from '@/settings';
import BaseController from './base-controller';
import jwt from 'jsonwebtoken';


export default class AccessTokenController extends BaseController {
  constructor() {
    super(new AccessTokenDatasource());
    this.accessTokenDatasource = new AccessTokenDatasource()
  }


  async create(user) {
    try {
      // const imageController = new ImageController();
      // const imageExpireInOneDay = IMAGE_URL_EXPIRE_TIME;
      // const userImage = profilePhoto ? profilePhoto : await imageController.getProfilePhoto(user.image, imageExpireInOneDay);

      const tokenPayload = {
        userId: user.id,
        name: user.name,
      }

      // create token
      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_SECRET_EXPIRE });
      return super.create({
        accessToken,
        userId: user.id
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


  // async isValid(accessToken) {
  //   try {
  //     const decodedToken = jwt.verify(accessToken, JWT_SECRET);
  
  //     if (decodedToken.exp < Date.now() / 1000) {
  //       return false;
  //     }
  
  //     if(jwt.verify(accessToken, process.env.JWT_SECRET)) {
  //       const tokenList = await this.getAll({
  //         where: {
  //           accessToken
  //         }
  //       });
        
  //       return tokenList.length > 0;
  //     }
  //     return false;
  //   }catch(error) {
  //     return false;
  //   }
  // }
}
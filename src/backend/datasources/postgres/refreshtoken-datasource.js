import BaseDatasource from "@/src/backend/datasource/base-datasource";
import { prisma } from "@/prisma/client";


export default class RefreshTokenDatasource extends BaseDatasource {
  constructor() {
    super(prisma.refreshToken);
  }

  /*delete(refreshToken) {
    return prisma.refreshToken.delete({
      where: {
        refreshToken
      }
    });
  }

  getByRefreshToken(refreshToken) {
    return prisma.refreshToken.findUnique({
      where: {
        refreshToken,
        deletedAt: null
      },
      include: {
        accessToken: true
      }
    })
  }*/
}
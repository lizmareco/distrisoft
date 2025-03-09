import BaseDatasource from "../base-datasource";
import { prisma } from "@/prisma/client";


export default class AccessTokenDatasource extends BaseDatasource {
  constructor() {
    super(prisma.accessToken);
  }

  /*delete(id) {
    return prisma.accessToken.delete({
      where: {
        id
      }
    });
  }

  // this invalidate all whitelist, and keep all from whiteList
  invalidateTokens(userId, whiteList) {
    return prisma.accessToken.deleteMany({
      where: {
        AND: [
          { userId: userId },
          { NOT: {
            token: {
              in: whiteList
            }
          }}
        ]
      }
    });
  }*/
}
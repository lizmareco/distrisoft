import BaseDatasource from "@/src/backend/datasources/base-datasource";
import { prisma } from "@/prisma/client";

export default class UserDatasource extends BaseDatasource {
  constructor() {
    super(prisma.usuario);
  }


  /**
   * 
   * @param {string} id 
   * @param {string[]} includes 
   * @returns 
   */
  get(id, { includes = [] }= {}) {
    const args = {};
    const include = generateMongoInclude(includes);

    if(include) {
      args.include = include;
    }

    return prisma.user.findUnique({
      where: {
        id: id,
        deletedAt: null
      },
      ...args
    });
  }

  /**
   * 
   * @param {string} email 
   * @param {string[]} includes 
   * @returns 
   */
  getByEmail(email, { includes = [] } = {}) {
    const args = {};
    const include = generateMongoInclude(includes);

    if(include) {
      args.include = include;
    }

    return prisma.user.findUnique({
      where: {
        email: email,
        deletedAt: null
      },
      ...args
    });
  }

}
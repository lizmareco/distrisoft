import BaseDatasource from "../base-datasource";
import { prisma } from "@/prisma/client";


export default class UserLoginDatasource extends BaseDatasource{
  constructor() {
    super(prisma.userLogin);
  }
}
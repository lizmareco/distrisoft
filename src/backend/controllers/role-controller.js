import RoleDatasource from "@/src/backend/datasource/role-datasource";


export default class RoleController {
  constructor() {
    super(new RoleDatasource);
    this.datasource = new RoleDatasource();
  }
}
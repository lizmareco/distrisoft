import UsuarioDatasource from '@/src/backend/datasources/postgres/usuario-datasource';
import BaseController from './base-controller';


export default class UsuarioController extends BaseController {
  constructor() {
    super(new UsuarioDatasource());
    this.userDatasource = new UsuarioDatasource();
  }
}
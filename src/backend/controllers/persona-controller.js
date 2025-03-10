import PersonaDatasource from '@/src/backend/datasources/postgres/persona-datasource';
import BaseController from './base-controller';


export default class PersonaController extends BaseController {
  constructor() {
    super(new PersonaDatasource());
    this.personaDatasource = new PersonaDatasource();
  }


  obtenerPersonaConCorreo(correoPersona) {
    return this.personaDatasource.obtenerPersonaConCorreo(correoPersona);
  }
}
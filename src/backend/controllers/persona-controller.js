import PersonaDatasource from '@/src/backend/datasources/persona-datasource';
import BaseController from './base-controller';


export default class PersonaController extends BaseController {
  constructor() {
    super(new PersonaDatasource());
    this.personaDatasource = new PersonaDatasource();
  }
}
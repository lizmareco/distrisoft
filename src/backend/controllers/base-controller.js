export default class BaseController {
    constructor(datasource) {
      this.datasource = datasource;
    }
  
    getAll(arg) {
      return this.datasource.getAll(arg);
    }
  
    get(id, args) {
      return this.datasource.get(id, args);
    }
  
    getFirst(arg) {
      return this.datasource.getFirst(arg);
    }
  
    create(data) {
      return this.datasource.create(data);
    }
  
    update(id, data) {
      return this.datasource.update(id, data);
    }
  
    updateMany(data, where) {
      return this.datasource.updateMany(data, where);
    }
  
    delete(id) {
      return this.datasource.delete(id);
    }
  }
export default class BaseDatasource {
  // Se ha modificado el constructor para aceptar un parámetro "primaryKey"
  // que define el nombre del campo identificador, por defecto 'id'.
    constructor(model, primaryKey = 'id') {
      this.model = model;
      this.primaryKey = primaryKey; // Campo identificador dinámico asignado
    }
  
    getAll(arg) {
      return this.model.findMany(arg);
    }
  
  
    get(id, { includes= [] } = {}) {
      const include = generateMongoInclude(includes);
  
      return this.model.findUnique({
        where: {
          id
        },
        include: include ? include : undefined
      });
    }
  
  
    getFirst(args={}) {
      return this.model.findFirst(args);
    }
  
    create(data) {
      return this.model.create({
        data: {
          ...data,
          deletedAt: null
        }
      });
    }
  
  
    update(id, data) {
      return this.model.update({
        data: {
          ...data,
          updatedAt: new Date()
        },
        where: {
          [this.primaryKey]: id // Uso del campo identificador dinámico
        }
      });
    }
  
  
    updateMany(data, filter) {
      return this.model.updateMany({
        data: data,
        where: filter
      })
    }
  
  
    delete(id) {
      return this.model.update(
        { data: { deletedAt: new Date() },
          where: { [this.primaryKey]: id } // Uso del campo identificador dinámico
        }
      );
    }
  }
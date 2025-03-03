export default class BaseDatasource {
    constructor(model) {
      this.model = model;
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
          id: id
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
          where: { id: id }
        }
      );
    }
  }
export default class CustomError extends Error {
  constructor(message, status, { internalCode= undefined } = {}) {
    super(message);
    this.status = status;
    this.isCustom = true;
    this.internalCode = internalCode;
  }
}
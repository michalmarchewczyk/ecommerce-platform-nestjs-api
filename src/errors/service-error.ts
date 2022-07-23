export abstract class ServiceError extends Error {
  protected constructor(public message: string = '') {
    super(message);

    /* istanbul ignore if */
    /* istanbul ignore else */
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, new.target.prototype);
    } else {
      (this as any).__proto__ = new.target.prototype;
    }
  }
}

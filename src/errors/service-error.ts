export class ServiceError extends Error {
  constructor(public message: string = '') {
    super(message);

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, new.target.prototype);
    } else {
      (this as any).__proto__ = new.target.prototype;
    }
  }

  get name(): string {
    return this.constructor.name;
  }
}

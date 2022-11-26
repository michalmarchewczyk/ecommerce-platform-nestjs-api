import { ServiceError } from './service-error';

export class ParseError extends ServiceError {
  constructor(name: string) {
    super();
    this.message = `There was an error while parsing ${name}`;
  }
}

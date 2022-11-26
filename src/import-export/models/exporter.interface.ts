export interface Exporter<T> {
  export(): Promise<T[]>;
}

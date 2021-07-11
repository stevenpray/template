export interface FactoryInterface<T, O extends any[] = []> {
  create: (...args: O) => T;
}

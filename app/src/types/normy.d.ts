declare module 'normy' {
  export interface Schema<T = any> {
    define(definition: Record<string, Schema | Schema[]>): void;
  }

  export namespace schema {
    export class Entity<T = any> implements Schema<T> {
      constructor(key: string, definition?: Record<string, any>, options?: Record<string, any>);
      define(definition: Record<string, Schema | Schema[]>): void;
    }

    export class Union<T = any> implements Schema<T> {
      constructor(definition: Record<string, Schema>, schemaAttribute?: string | ((value: any) => string));
    }

    export class Values<T = any> implements Schema<T> {
      constructor(definition: Schema, options?: Record<string, any>);
    }

    export class Array<T = any> implements Schema<T> {
      constructor(definition: Schema, options?: Record<string, any>);
    }
  }

  export interface NormalizedSchema<T = any> {
    entities: Record<string, Record<string, T>>;
    result: string | string[];
  }

  export function normalize<T = any>(
    data: T | T[],
    schema: Schema | Schema[]
  ): NormalizedSchema<T>;

  export function denormalize<T = any>(
    input: string | string[] | Record<string, any>,
    schema: Schema | Schema[],
    entities: Record<string, Record<string, any>>
  ): T;
}
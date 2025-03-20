import { describe, expect, it } from 'bun:test';
import { err, ok, Result } from 'resulty';
import Decoder from '../src/Decoder';
import { InferType, InferTypeFromFn } from '../src/types';

describe('types', () => {
  describe('InferType', () => {
    it('should infer the correct type from a Decoder', () => {
      const stringDecoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      });

      type InferredStringType = InferType<typeof stringDecoder>;
      // This assertion is a compile-time check. If the types are incorrect,
      // TypeScript will throw an error.
      const testString: InferredStringType = 'hello';
      expect(testString).toBe('hello');
      // @ts-expect-error
      const testNumber: InferredStringType = 123;
    });

    it('should infer the correct type from a Decoder with a number', () => {
      const numberDecoder = new Decoder<number>((value) => {
        if (typeof value === 'number') {
          return ok(value);
        }
        return err('Not a number');
      });

      type InferredNumberType = InferType<typeof numberDecoder>;
      const testNumber: InferredNumberType = 123;
      expect(testNumber).toBe(123);
      // @ts-expect-error
      const testString: InferredNumberType = 'hello';
    });

    it('should infer the correct type from a Decoder with a boolean', () => {
      const booleanDecoder = new Decoder<boolean>((value) => {
        if (typeof value === 'boolean') {
          return ok(value);
        }
        return err('Not a boolean');
      });

      type InferredBooleanType = InferType<typeof booleanDecoder>;
      const testBoolean: InferredBooleanType = true;
      expect(testBoolean).toBe(true);
      // @ts-expect-error
      const testString: InferredBooleanType = 'hello';
    });

    it('should infer the correct type from a Decoder with a complex object', () => {
      interface User {
        name: string;
        age: number;
      }

      const userDecoder = new Decoder<User>((value) => {
        if (
          typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'age' in value &&
          typeof value.name === 'string' &&
          typeof value.age === 'number'
        ) {
          return ok({ name: value.name, age: value.age });
        }
        return err('Invalid user object');
      });

      type InferredUserType = InferType<typeof userDecoder>;
      const testUser: InferredUserType = { name: 'John Doe', age: 30 };
      expect(testUser).toEqual({ name: 'John Doe', age: 30 });
      // @ts-expect-error
      const testString: InferredUserType = 'hello';
      // @ts-expect-error
      const testUser2: InferredUserType = { name: 'John Doe', age: '30' };
    });
  });

  describe('InferTypeFromFn', () => {
    it('should infer the correct type from a decoder function', () => {
      const stringDecoderFn = (value: any): Result<string, string> => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      };

      type InferredStringType = InferTypeFromFn<typeof stringDecoderFn>;
      const testString: InferredStringType = 'hello';
      expect(testString).toBe('hello');
      // @ts-expect-error
      const testNumber: InferredStringType = 123;
    });

    it('should infer the correct type from a decoder function with a number', () => {
      const numberDecoderFn = (value: any): Result<string, number> => {
        if (typeof value === 'number') {
          return ok(value);
        }
        return err('Not a number');
      };

      type InferredNumberType = InferTypeFromFn<typeof numberDecoderFn>;
      const testNumber: InferredNumberType = 123;
      expect(testNumber).toBe(123);
      // @ts-expect-error
      const testString: InferredNumberType = 'hello';
    });

    it('should infer the correct type from a decoder function with a boolean', () => {
      const booleanDecoderFn = (value: any): Result<string, boolean> => {
        if (typeof value === 'boolean') {
          return ok(value);
        }
        return err('Not a boolean');
      };

      type InferredBooleanType = InferTypeFromFn<typeof booleanDecoderFn>;
      const testBoolean: InferredBooleanType = true;
      expect(testBoolean).toBe(true);
      // @ts-expect-error
      const testString: InferredBooleanType = 'hello';
    });

    it('should infer the correct type from a decoder function with a complex object', () => {
      interface User {
        name: string;
        age: number;
      }

      const userDecoderFn = (value: any): Result<string, User> => {
        if (
          typeof value === 'object' &&
          value !== null &&
          'name' in value &&
          'age' in value &&
          typeof value.name === 'string' &&
          typeof value.age === 'number'
        ) {
          return ok({ name: value.name, age: value.age });
        }
        return err('Invalid user object');
      };

      type InferredUserType = InferTypeFromFn<typeof userDecoderFn>;
      const testUser: InferredUserType = { name: 'John Doe', age: 30 };
      expect(testUser).toEqual({ name: 'John Doe', age: 30 });
      // @ts-expect-error
      const testString: InferredUserType = 'hello';
      // @ts-expect-error
      const testUser2: InferredUserType = { name: 'John Doe', age: '30' };
    });
  });
});

import { describe, expect, it } from 'bun:test';
import { Result } from 'resulty';
import Decoder from '../src/Decoder';
import { boolean, number, string } from '../src/base';
import { array } from '../src/containers';
import { createDecoderFromStructure, oneOf, stringLiteral } from '../src/structures';
import { InferType } from '../src/types';
import { identity, snakeCase } from '../src/utils';

// Helper function to check for errors
function expectError<T>(result: Result<string, T>, expectedError: string) {
  result.cata({
    Err: (e) => expect(e).toBe(expectedError),
    Ok: () => expect(true).toBe(false),
  });
}

// Helper function to check for success
function expectSuccess<T>(result: Result<string, T>, expectedValue: T) {
  result.cata({
    Err: (msg) => {
      console.error('Expected success but got error:', msg);
      expect(true).toBe(false);
    },
    Ok: (v) => expect(v).toEqual(expectedValue),
  });
}

describe('structures', () => {
  describe('oneOf', () => {
    it('should fail if no decoders are provided', () => {
      const decoder = oneOf([]);
      expectError(decoder.decodeAny('hello'), 'No decoders specified.');
    });

    it('should decode a union type with complex objects', () => {
      interface User {
        type: 'user';
        name: string;
        age: number;
      }

      interface Admin {
        type: 'admin';
        name: string;
        permissions: string[];
      }

      type Person = User | Admin;

      const user1Decoder = createDecoderFromStructure({
        type: stringLiteral('user'),
        name: string,
        age: number,
      });
      type User1 = InferType<typeof user1Decoder>;

      const admin1Decoder = createDecoderFromStructure({
        type: stringLiteral('admin'),
        name: string,
        permissions: array(string),
      });
      type Admin1 = InferType<typeof admin1Decoder>;

      type Person1 = User1 | Admin1;

      const person1Decoder = oneOf<Person1>([
        user1Decoder.map<Person1>((u) => u),
        admin1Decoder.map<Person1>((a) => a),
      ]);

      const userDecoder: Decoder<User> = createDecoderFromStructure({
        type: stringLiteral('user'),
        name: string,
        age: number,
      });

      const adminDecoder: Decoder<Admin> = createDecoderFromStructure({
        type: stringLiteral('admin'),
        name: string,
        permissions: array(string),
      });

      const personDecoder = oneOf([userDecoder, adminDecoder].map((d) => d.map<Person>(identity)));

      const user: User = { type: 'user', name: 'John Doe', age: 30 };
      const admin: Admin = { type: 'admin', name: 'Jane Doe', permissions: ['read', 'write'] };

      expectSuccess(personDecoder.decodeAny(user), user);
      expectSuccess(personDecoder.decodeAny(admin), admin);
      expectError(
        personDecoder.decodeAny({ type: 'unknown', name: 'Bob' }),
        'I found the following problems:\nExpected user but got "unknown":\noccurred in a field named \'type\'\nExpected admin but got "unknown":\noccurred in a field named \'type\''
      );
      // Type check
      const test: Decoder<Person> = personDecoder;
    });
  });

  describe('createDecoderFromStructure', () => {
    it('should decode a simple object structure', () => {
      const structure = {
        name: string,
        age: number,
      };
      const decoder = createDecoderFromStructure(structure);
      const obj = { name: 'John Doe', age: 30 };
      expectSuccess(decoder.decodeAny(obj), obj);
    });

    it('should decode a nested object structure', () => {
      const structure = {
        user: {
          name: string,
          age: number,
        },
      };
      const decoder = createDecoderFromStructure(structure);
      const obj = { user: { name: 'John Doe', age: 30 } };
      expectSuccess(decoder.decodeAny(obj), obj);
    });

    it('should handle decoder failures in a simple structure', () => {
      const structure = {
        name: string,
        age: number,
      };
      const decoder = createDecoderFromStructure(structure);
      const obj = { name: 'John Doe', age: '30' };
      expectError(
        decoder.decodeAny(obj),
        'I expected to find a number but instead I found "30":\noccurred in a field named \'age\''
      );
    });

    it('should handle decoder failures in a nested structure', () => {
      const structure = {
        user: {
          name: string,
          age: number,
        },
      };
      const decoder = createDecoderFromStructure(structure);
      const obj = { user: { name: 'John Doe', age: '30' } };
      expectError(
        decoder.decodeAny(obj),
        "I expected to find a number but instead I found \"30\":\noccurred in a field named 'age':\noccurred in a field named 'user'"
      );
    });

    it('should handle a mix of decoders and nested structures', () => {
      const structure = {
        name: string,
        details: {
          age: number,
          isActive: boolean,
        },
      };
      const decoder = createDecoderFromStructure(structure);
      const obj = { name: 'John Doe', details: { age: 30, isActive: true } };
      expectSuccess(decoder.decodeAny(obj), obj);
    });

    it('should handle decoder failures in a mixed structure', () => {
      const structure = {
        name: string,
        details: {
          age: number,
          isActive: boolean,
        },
      };
      const decoder = createDecoderFromStructure(structure);
      const obj = { name: 'John Doe', details: { age: '30', isActive: true } };
      expectError(
        decoder.decodeAny(obj),
        "I expected to find a number but instead I found \"30\":\noccurred in a field named 'age':\noccurred in a field named 'details'"
      );
    });

    it('should handle an empty structure', () => {
      const structure = {};
      const decoder = createDecoderFromStructure(structure);
      expectSuccess(decoder.decodeAny({}), {});
    });

    it('should handle snake_case keys', () => {
      const structure = {
        firstName: string,
        lastName: string,
      };
      const decoder = createDecoderFromStructure(structure, snakeCase);
      const obj = { first_name: 'John', last_name: 'Doe' };

      expectSuccess(decoder.decodeAny(obj), { firstName: 'John', lastName: 'Doe' });
    });
  });

  describe('stringLiteral', () => {
    it('should succeed when the input is equal to the specified string literal', () => {
      const decoder = stringLiteral('hello');
      expectSuccess(decoder.decodeAny('hello'), 'hello');
    });

    it('should fail when the input is not equal to the specified string literal', () => {
      const decoder = stringLiteral('hello');
      expectError(decoder.decodeAny('world'), 'Expected hello but got "world"');
      expectError(decoder.decodeAny(5), 'Expected hello but got 5');
      expectError(decoder.decodeAny(true), 'Expected hello but got true');
      expectError(decoder.decodeAny(null), 'Expected hello but got null');
      expectError(decoder.decodeAny(undefined), 'Expected hello but got undefined');
      expectError(decoder.decodeAny({}), 'Expected hello but got {}');
      expectError(decoder.decodeAny([]), 'Expected hello but got []');
    });
  });
});

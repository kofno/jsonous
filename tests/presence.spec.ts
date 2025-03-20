import { describe, expect, it } from 'bun:test';
import { just, nothing } from 'maybeasy';
import { err, ok, Result } from 'resulty';
import { string } from '../src/base';
import Decoder from '../src/Decoder';
import { maybe, nullable } from '../src/presence';

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

describe('presence', () => {
  describe('maybe', () => {
    it('should decode a valid value to Just', () => {
      expectSuccess(maybe(string).decodeAny('hello'), just('hello'));
    });

    it('should decode null to Nothing', () => {
      expectSuccess(maybe(string).decodeAny(null), nothing());
    });

    it('should decode undefined to Nothing', () => {
      expectSuccess(maybe(string).decodeAny(undefined), nothing());
    });

    it('should decode a failing decoder to Nothing', () => {
      expectSuccess(maybe(string).decodeAny(123), nothing());
    });

    it('should decode a failing decoder to Nothing with a complex object', () => {
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
      expectSuccess(maybe(userDecoder).decodeAny(123), nothing());
    });
  });

  describe('nullable', () => {
    it('should decode a valid value to Just', () => {
      expectSuccess(nullable(string).decodeAny('hello'), just('hello'));
    });

    it('should decode null to Nothing', () => {
      expectSuccess(nullable(string).decodeAny(null), nothing());
    });

    it('should decode undefined to Nothing', () => {
      expectSuccess(nullable(string).decodeAny(undefined), nothing());
    });

    it('should fail with a failing decoder', () => {
      expectError(
        nullable(string).decodeAny(123),
        'I expected to find a string but instead I found 123'
      );
    });

    it('should fail with a failing decoder with a complex object', () => {
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
      expectError(nullable(userDecoder).decodeAny(123), 'Invalid user object');
    });
  });
});

import { describe, expect, it } from 'bun:test';
import { err, ok, Result } from 'resulty';
import Decoder from '../src/Decoder';
import { dict, keyValuePairs } from '../src/associative';

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

describe('associative', () => {
  describe('keyValuePairs', () => {
    it('should decode an object into an array of key-value pairs', () => {
      const decoder = keyValuePairs(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      const obj = { a: 1, b: 2, c: 3 };
      const expected = [
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ];
      expectSuccess(decoder.decodeAny(obj), expected);
    });

    it('should handle decoder failures', () => {
      const decoder = keyValuePairs(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      const obj = { a: 1, b: 'hello', c: 3 };
      expectError(decoder.decodeAny(obj), "Key 'b' failed to decode: Not a number");
    });

    it('should handle non-object inputs', () => {
      const decoder = keyValuePairs(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(decoder.decodeAny(123), "Expected to find an object and instead found '123'");
      expectError(
        decoder.decodeAny('hello'),
        'Expected to find an object and instead found \'"hello"\''
      );
      expectError(decoder.decodeAny(null), "Expected to find an object and instead found 'null'");
      expectError(
        decoder.decodeAny(undefined),
        "Expected to find an object and instead found 'undefined'"
      );
      expectError(
        decoder.decodeAny([1, 2, 3]),
        "Expected to find an object and instead found '[1,2,3]'"
      );
    });

    it('should handle empty objects', () => {
      const decoder = keyValuePairs(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectSuccess(decoder.decodeAny({}), []);
    });
  });

  describe('dict', () => {
    it('should decode an object into a Map', () => {
      const decoder = dict(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      const obj = { a: 1, b: 2, c: 3 };
      const expected = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
      expectSuccess(decoder.decodeAny(obj), expected);
    });

    it('should handle decoder failures', () => {
      const decoder = dict(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      const obj = { a: 1, b: 'hello', c: 3 };
      expectError(decoder.decodeAny(obj), "Key 'b' failed to decode: Not a number");
    });

    it('should handle non-object inputs', () => {
      const decoder = dict(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(decoder.decodeAny(123), "Expected to find an object and instead found '123'");
      expectError(
        decoder.decodeAny('hello'),
        'Expected to find an object and instead found \'"hello"\''
      );
      expectError(decoder.decodeAny(null), "Expected to find an object and instead found 'null'");
      expectError(
        decoder.decodeAny(undefined),
        "Expected to find an object and instead found 'undefined'"
      );
      expectError(
        decoder.decodeAny([1, 2, 3]),
        "Expected to find an object and instead found '[1,2,3]'"
      );
    });

    it('should handle empty objects', () => {
      const decoder = dict(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectSuccess(decoder.decodeAny({}), new Map());
    });
  });
});

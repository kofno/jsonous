import { describe, expect, it } from 'bun:test';
import { err, ok, Result } from 'resulty';
import Decoder from '../src/Decoder';
import { array, at, field } from '../src/containers';

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

describe('containers', () => {
  describe('array', () => {
    it('should decode an array of values', () => {
      const decoder = array(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectSuccess(decoder.decodeAny([1, 2, 3]), [1, 2, 3]);
    });

    it('should handle decoder failures within the array', () => {
      const decoder = array(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(
        decoder.decodeAny([1, 'hello', 3]),
        'Not a number:\nerror found in an array at [1]'
      );
    });

    it('should handle non-array inputs', () => {
      const decoder = array(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(decoder.decodeAny(123), 'I expected an array but instead I found 123');
      expectError(decoder.decodeAny('hello'), 'I expected an array but instead I found "hello"');
      expectError(decoder.decodeAny(null), 'I expected an array but instead I found null');
      expectError(
        decoder.decodeAny(undefined),
        'I expected an array but instead I found undefined'
      );
      expectError(decoder.decodeAny({}), 'I expected an array but instead I found {}');
    });

    it('should handle empty arrays', () => {
      const decoder = array(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectSuccess(decoder.decodeAny([]), []);
    });

    it('should handle multiple errors', () => {
      const decoder = array(
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(
        decoder.decodeAny([1, 'hello', 3, 'world']),
        'Not a number:\nerror found in an array at [1]'
      );
    });
  });

  describe('field', () => {
    it('should decode a field from an object', () => {
      const decoder = field(
        'name',
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      expectSuccess(decoder.decodeAny({ name: 'John Doe' }), 'John Doe');
    });

    it('should handle missing fields', () => {
      const decoder = field(
        'name',
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      expectError(
        decoder.decodeAny({ age: 30 }),
        'I expected to find an object with key \'name\' but instead I found {"age":30}'
      );
    });

    it('should handle decoder failures within the field', () => {
      const decoder = field(
        'age',
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(
        decoder.decodeAny({ name: 'John Doe', age: '30' }),
        "Not a number:\noccurred in a field named 'age'"
      );
    });

    it('should handle null or undefined objects', () => {
      const decoder = field(
        'name',
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      expectError(
        decoder.decodeAny(null),
        "I expected to find an object with key 'name' but instead I found null"
      );
      expectError(
        decoder.decodeAny(undefined),
        "I expected to find an object with key 'name' but instead I found undefined"
      );
    });
  });

  describe('at', () => {
    it('should decode a value at a nested path', () => {
      const decoder = at(
        ['user', 'address', 'city'],
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      const obj = { user: { address: { city: 'New York' } } };
      expectSuccess(decoder.decodeAny(obj), 'New York');
    });

    it('should handle missing paths', () => {
      const decoder = at(
        ['user', 'address', 'city'],
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      const obj = { user: { address: {} } };
      expectError(
        decoder.decodeAny(obj),
        'I found an error in the \'at\' path. I could not find path \'["user","address","city"]\' in {"user":{"address":{}}}'
      );
    });

    it('should handle decoder failures at the path', () => {
      const decoder = at(
        ['user', 'age'],
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      const obj = { user: { age: '30' } };
      expectError(decoder.decodeAny(obj), 'Not a number');
    });

    it('should handle null or undefined at the root', () => {
      const decoder = at(
        ['user', 'age'],
        new Decoder<number>((value) => {
          if (typeof value === 'number') {
            return ok(value);
          }
          return err('Not a number');
        })
      );
      expectError(
        decoder.decodeAny(null),
        "I found an error. Could not apply 'at' path to an undefined or null value."
      );
      expectError(
        decoder.decodeAny(undefined),
        "I found an error. Could not apply 'at' path to an undefined or null value."
      );
    });

    it('should handle array indices in the path', () => {
      const decoder = at(
        ['users', 0, 'name'],
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      const obj = { users: [{ name: 'John Doe' }] };
      expectSuccess(decoder.decodeAny(obj), 'John Doe');
    });

    it('should handle missing array indices', () => {
      const decoder = at(
        ['users', 1, 'name'],
        new Decoder<string>((value) => {
          if (typeof value === 'string') {
            return ok(value);
          }
          return err('Not a string');
        })
      );
      const obj = { users: [{ name: 'John Doe' }] };
      expectError(
        decoder.decodeAny(obj),
        'I found an error in the \'at\' path. I could not find path \'["users",1]\' in {"users":[{"name":"John Doe"}]}'
      );
    });
  });
});

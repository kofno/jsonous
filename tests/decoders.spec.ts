import { expect, describe, it, mock } from 'bun:test';
import {
  array,
  at,
  boolean,
  date,
  dateISO,
  dateJSON,
  dict,
  fail,
  field,
  keyValuePairs,
  maybe,
  nullable,
  number,
  oneOf,
  string,
  succeed,
  safeStringify,
} from '../src/index'; // Assuming your main file is index.ts
import { just, nothing } from 'maybeasy';
import { Result } from 'resulty';

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

describe('Decoder', () => {
  describe('map', () => {
    it('should map over a successful result', () => {
      const decoder = string.map((s) => s.length);
      expectSuccess(decoder.decodeAny('hello'), 5);
    });

    it('should not map over a failed result', () => {
      const decoder = string.map((s) => s.length);
      expectError(decoder.decodeAny(123), 'I expected to find a string but instead I found 123');
    });
  });

  describe('andThen', () => {
    it('should chain decoders together', () => {
      const dateValue = '2023-10-27';
      const decoder = string.andThen((s) => date.map((d) => ({ date: d, string: s })));
      expectSuccess(decoder.decodeAny(dateValue), { date: new Date(dateValue), string: dateValue });
      expectError(decoder.decodeAny('hello'), 'I expected a date but instead I found "hello"');
      expectError(decoder.decodeAny(5), 'I expected to find a string but instead I found 5');
      expectError(
        decoder.decodeAny({ a: 1, b: 2 }),
        'I expected to find a string but instead I found {"a":1,"b":2}'
      );
    });
  });

  describe('assign', () => {
    it('should assign values to an object', () => {
      const decoder = string
        .assign('length', (s) => succeed(s.length))
        .andThen((obj) => succeed({ length: obj.length }));
      expectSuccess(decoder.decodeAny('hello'), { length: 5 });
    });

    it('should assign values to an object with multiple fields', () => {
      const decoder = string
        .assign('length', (s) => succeed(s.length))
        .assign('firstChar', (s) => succeed(s[0]))
        .andThen((obj) => succeed({ length: obj.length, firstChar: obj.firstChar }));
      expectSuccess(decoder.decodeAny('hello'), { length: 5, firstChar: 'h' });
    });

    it('should handle decoder failures', () => {
      const decoder = string
        .assign('length', (s) => succeed(s.length))
        .assign('firstChar', (s) => fail('oops'));
      expectError(decoder.decodeAny('hello'), 'oops');
    });

    it('should handle decoder failures in the first decoder', () => {
      const decoder = fail<string>('oops')
        .assign('length', (s) => succeed(s.length))
        .assign('firstChar', (s) => succeed(s[0]));
      expectError(decoder.decodeAny('hello'), 'oops');
    });

    it('should handle decoder failures in the second decoder', () => {
      const decoder = string
        .assign('length', fail('oops'))
        .assign('firstChar', (s) => succeed(s[0]));
      expectError(decoder.decodeAny('hello'), 'oops');
    });
  });

  describe('do', () => {
    it('should perform a side effect', () => {
      const mockFn = mock();
      const decoder = string.do(mockFn);
      decoder.decodeAny('hello');
      expect(mockFn).toHaveBeenCalledWith('hello');
    });
  });

  describe('mapError', () => {
    it('should map over a failed result', () => {
      const decoder = string.mapError((e) => `Error: ${e}`);
      expectError(
        decoder.decodeAny(123),
        'Error: I expected to find a string but instead I found 123'
      );
    });

    it('should not map over a successful result', () => {
      const decoder = string.mapError((e) => `Error: ${e}`);
      expectSuccess(decoder.decodeAny('hello'), 'hello');
    });
  });

  describe('orElse', () => {
    it('should use an alternative decoder if the first fails', () => {
      const decoder = string.orElse(() => succeed('fallback'));
      expectSuccess(decoder.decodeAny(123), 'fallback');
      expectSuccess(decoder.decodeAny('hello'), 'hello');
    });
  });

  describe('elseDo', () => {
    it('should perform a side effect on failure', () => {
      const mockFn = mock();
      const decoder = string.elseDo(mockFn);
      decoder.decodeAny(123);
      expect(mockFn).toHaveBeenCalledWith('I expected to find a string but instead I found 123');
    });

    it('should not perform a side effect on success', () => {
      const mockFn = mock();
      const decoder = string.elseDo(mockFn);
      decoder.decodeAny('hello');
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('decodeAny', () => {
    it('should decode any value', () => {
      expectSuccess(string.decodeAny('hello'), 'hello');
      expectSuccess(number.decodeAny(123), 123);
      expectSuccess(boolean.decodeAny(true), true);
    });
  });

  describe('decodeJson', () => {
    it('should decode a JSON string', () => {
      expectSuccess(string.decodeJson('"hello"'), 'hello');
      expectSuccess(number.decodeJson('123'), 123);
      expectSuccess(boolean.decodeJson('true'), true);
    });

    it('should handle JSON parse errors', () => {
      expectError(
        string.decodeJson('invalid'),
        'JSON Parse error: Unexpected identifier "invalid"'
      );
    });
  });

  describe('toAnyFn', () => {
    it('should return a function that decodes any value', () => {
      const fn = string.toAnyFn();
      expectSuccess(fn('hello'), 'hello');
      expectError(fn(123), 'I expected to find a string but instead I found 123');
    });
  });

  describe('toJsonFn', () => {
    it('should return a function that decodes a JSON string', () => {
      const fn = string.toJsonFn();
      expectSuccess(fn('"hello"'), 'hello');
      expectError(fn('invalid'), 'JSON Parse error: Unexpected identifier "invalid"');
    });
  });

  describe('succeed', () => {
    it('should always succeed', () => {
      expectSuccess(succeed(123).decodeAny('hello'), 123);
    });
  });

  describe('fail', () => {
    it('should always fail', () => {
      expectError(fail('oops').decodeAny('hello'), 'oops');
    });
  });

  describe('string', () => {
    it('should decode a string', () => {
      expectSuccess(string.decodeAny('hello'), 'hello');
    });

    it('should fail if not a string', () => {
      expectError(string.decodeAny(123), 'I expected to find a string but instead I found 123');
    });
  });

  describe('number', () => {
    it('should decode a number', () => {
      expectSuccess(number.decodeAny(123), 123);
    });

    it('should fail if not a number', () => {
      expectError(
        number.decodeAny('hello'),
        'I expected to find a number but instead I found "hello"'
      );
    });
  });

  describe('boolean', () => {
    it('should decode a boolean', () => {
      expectSuccess(boolean.decodeAny(true), true);
      expectSuccess(boolean.decodeAny(false), false);
    });

    it('should fail if not a boolean', () => {
      expectError(
        boolean.decodeAny('hello'),
        'I expected to find a boolean but instead found "hello"'
      );
    });
  });

  describe('date', () => {
    it('should decode a date from a string', () => {
      const d = new Date('2023-10-27');
      expectSuccess(date.decodeAny('2023-10-27'), d);
    });

    it('should fail if not a date', () => {
      expectError(date.decodeAny('hello'), 'I expected a date but instead I found "hello"');
      expectError(date.decodeAny(NaN), 'I expected a date but instead I found null');
    });
  });

  describe('dateISO', () => {
    it('should decode an ISO date', () => {
      const d = new Date('2023-10-27T00:00:00.000Z');
      expectSuccess(dateISO.decodeAny('2023-10-27T00:00:00.000Z'), d);
    });

    it('should fail if not an ISO date', () => {
      expectError(dateISO.decodeAny('hello'), 'I expected an ISO date but instead I found "hello"');
    });
  });

  describe('dateJSON', () => {
    it('should decode a JSON date', () => {
      const d = new Date('2023-10-27T00:00:00.000Z');
      expectSuccess(dateJSON.decodeAny('2023-10-27T00:00:00.000Z'), d);
    });

    it('should fail if not a JSON date', () => {
      expectError(
        dateJSON.decodeAny('hello'),
        'I expected an JSON date but instead I found "hello"'
      );
    });
  });

  describe('array', () => {
    it('should decode an array', () => {
      expectSuccess(array(string).decodeAny(['hello', 'world']), ['hello', 'world']);
    });

    it('should fail if not an array', () => {
      expectError(
        array(string).decodeAny('hello'),
        'I expected an array but instead I found "hello"'
      );
    });

    it('should fail if an element fails', () => {
      expectError(
        array(string).decodeAny(['hello', 123]),
        'I expected to find a string but instead I found 123:\nerror found in an array at [1]'
      );
    });
  });

  describe('field', () => {
    it('should decode a field', () => {
      expectSuccess(field('name', string).decodeAny({ name: 'hello' }), 'hello');
    });

    it('should fail if the field is missing', () => {
      expectError(
        field('name', string).decodeAny({}),
        "I expected to find an object with key 'name' but instead I found {}"
      );
    });

    it('should fail if the field is the wrong type', () => {
      expectError(
        field('name', string).decodeAny({ name: 123 }),
        "I expected to find a string but instead I found 123:\noccurred in a field named 'name'"
      );
    });

    it('should fail if the value is null', () => {
      expectError(
        field('name', string).decodeAny(null),
        "I expected to find an object with key 'name' but instead I found null"
      );
    });

    it('should fail if the value is undefined', () => {
      expectError(
        field('name', string).decodeAny(undefined),
        "I expected to find an object with key 'name' but instead I found undefined"
      );
    });
  });

  describe('at', () => {
    it('should decode a value at a path', () => {
      const obj = { a: { b: { c: 'hello' } } };
      expectSuccess(at(['a', 'b', 'c'], string).decodeAny(obj), 'hello');
    });

    it('should handle array indices', () => {
      const obj = { a: [{ b: 'hello' }] };
      expectSuccess(at(['a', 0, 'b'], string).decodeAny(obj), 'hello');
    });

    it('should fail if the path is missing', () => {
      const obj = { a: { b: { c: 'hello' } } };
      expectError(
        at(['a', 'b', 'd'], string).decodeAny(obj),
        'I found an error in the \'at\' path. I could not find path \'["a","b","d"]\' in {"a":{"b":{"c":"hello"}}}'
      );
    });

    it('should fail if the value is null', () => {
      expectError(
        at(['a'], string).decodeAny(null),
        "I found an error. Could not apply 'at' path to an undefined or null value."
      );
    });

    it('should fail if the value is undefined', () => {
      expectError(
        at(['a'], string).decodeAny(undefined),
        "I found an error. Could not apply 'at' path to an undefined or null value."
      );
    });
  });

  describe('maybe', () => {
    it('should decode a maybe', () => {
      expectSuccess(maybe(string).decodeAny('hello'), just('hello'));
      expectSuccess(maybe(string).decodeAny(123), nothing());
    });
  });

  describe('nullable', () => {
    it('should decode a nullable', () => {
      expectSuccess(nullable(string).decodeAny('hello'), just('hello'));
      expectSuccess(nullable(string).decodeAny(null), nothing());
      expectSuccess(nullable(string).decodeAny(undefined), nothing());
    });

    it('should fail if the decoder fails and the value is not null or undefined', () => {
      expectError(
        nullable(string).decodeAny(123),
        'I expected to find a string but instead I found 123'
      );
    });
  });

  describe('oneOf', () => {
    it('should decode with one of the decoders', () => {
      const decoder = oneOf<string | number>([
        string.map<string | number>((s) => s),
        number.map<string | number>((n) => n),
      ]);
      expectSuccess(decoder.decodeAny('hello'), 'hello');
      expectSuccess(decoder.decodeAny(123), 123);
      expectError(
        decoder.decodeAny(true),
        'I found the following problems:\n\nI expected to find a string but instead I found true\nI expected to find a number but instead I found true'
      );
    });

    it('should fail if no decoders are provided', () => {
      expectError(oneOf([]).decodeAny('hello'), 'No decoders specified.');
    });
  });

  describe('keyValuePairs', () => {
    it('should decode key value pairs', () => {
      const obj = { a: 'hello', b: 'world' };
      expectSuccess(keyValuePairs(string).decodeAny(obj), [
        ['a', 'hello'],
        ['b', 'world'],
      ]);
    });

    it('should fail if not an object', () => {
      expectError(
        keyValuePairs(string).decodeAny('hello'),
        'Expected to find an object and instead found \'"hello"\''
      );
    });

    it('should fail if a value fails to decode', () => {
      const obj = { a: 'hello', b: 123 };
      expectError(
        keyValuePairs(string).decodeAny(obj),
        "Key 'b' failed to decode: I expected to find a string but instead I found 123"
      );
    });
  });

  describe('dict', () => {
    it('should decode a dictionary', () => {
      const obj = { a: 'hello', b: 'world' };
      const mapResult = dict(string).map(Object.fromEntries).decodeAny(obj);
      expectSuccess(mapResult, { a: 'hello', b: 'world' });
    });

    it('should fail if not an object', () => {
      expectError(
        dict(string).decodeAny('hello'),
        'Expected to find an object and instead found \'"hello"\''
      );
    });

    it('should fail if a value fails to decode', () => {
      const obj = { a: 'hello', b: 123 };
      expectError(
        dict(string).decodeAny(obj),
        "Key 'b' failed to decode: I expected to find a string but instead I found 123"
      );
    });
  });
});

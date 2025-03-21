import { describe, expect, it } from 'bun:test';
import { Result } from 'resulty';
import { boolean, fail, number, string, succeed } from '../src/base';

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

describe('base', () => {
  describe('succeed', () => {
    it('should always succeed with the given value', () => {
      const decoder = succeed(42);
      expectSuccess(decoder.decodeAny('anything'), 42);
      expectSuccess(decoder.decodeAny(null), 42);
      expectSuccess(decoder.decodeAny(undefined), 42);
      expectSuccess(decoder.decodeAny({}), 42);
    });
  });

  describe('fail', () => {
    it('should always fail with the given message', () => {
      const decoder = fail('This is a failure');
      expectError(decoder.decodeAny('anything'), 'This is a failure');
      expectError(decoder.decodeAny(null), 'This is a failure');
      expectError(decoder.decodeAny(undefined), 'This is a failure');
      expectError(decoder.decodeAny({}), 'This is a failure');
    });
  });

  describe('string', () => {
    it('should succeed with a string', () => {
      expectSuccess(string.decodeAny('hello'), 'hello');
      expectSuccess(string.decodeAny(''), '');
    });

    it('should fail with a non-string', () => {
      expectError(string.decodeAny(123), 'I expected to find a string but instead I found 123');
      expectError(string.decodeAny(true), 'I expected to find a string but instead I found true');
      expectError(string.decodeAny(null), 'I expected to find a string but instead I found null');
      expectError(
        string.decodeAny(undefined),
        'I expected to find a string but instead I found undefined'
      );
      expectError(string.decodeAny({}), 'I expected to find a string but instead I found {}');
      expectError(string.decodeAny([]), 'I expected to find a string but instead I found []');
    });
  });

  describe('number', () => {
    it('should succeed with a number', () => {
      expectSuccess(number.decodeAny(123), 123);
      expectSuccess(number.decodeAny(0), 0);
      expectSuccess(number.decodeAny(-1), -1);
      expectSuccess(number.decodeAny(3.14), 3.14);
    });

    it('should fail with a non-number', () => {
      expectError(
        number.decodeAny('hello'),
        'I expected to find a number but instead I found "hello"'
      );
      expectError(number.decodeAny(true), 'I expected to find a number but instead I found true');
      expectError(number.decodeAny(null), 'I expected to find a number but instead I found null');
      expectError(
        number.decodeAny(undefined),
        'I expected to find a number but instead I found undefined'
      );
      expectError(number.decodeAny({}), 'I expected to find a number but instead I found {}');
      expectError(number.decodeAny([]), 'I expected to find a number but instead I found []');
    });
  });

  describe('boolean', () => {
    it('should succeed with a boolean', () => {
      expectSuccess(boolean.decodeAny(true), true);
      expectSuccess(boolean.decodeAny(false), false);
    });

    it('should fail with a non-boolean', () => {
      expectError(
        boolean.decodeAny('hello'),
        'I expected to find a boolean but instead found "hello"'
      );
      expectError(boolean.decodeAny(123), 'I expected to find a boolean but instead found 123');
      expectError(boolean.decodeAny(null), 'I expected to find a boolean but instead found null');
      expectError(
        boolean.decodeAny(undefined),
        'I expected to find a boolean but instead found undefined'
      );
      expectError(boolean.decodeAny({}), 'I expected to find a boolean but instead found {}');
      expectError(boolean.decodeAny([]), 'I expected to find a boolean but instead found []');
    });
  });
});

import { describe, expect, it } from 'bun:test';
import { eql } from '../src/predicates';
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

describe('base', () => {
  describe('eql', () => {
    it('should succeed when the input is equal to the specified value', () => {
      const decoder = eql(5);
      expectSuccess(decoder.decodeAny(5), 5);
    });

    it('should fail when the input is not equal to the specified value', () => {
      const decoder = eql(5);
      expectError(decoder.decodeAny(10), 'Expected 5 but got 10');
      expectError(decoder.decodeAny('5'), 'Expected 5 but got "5"');
      expectError(decoder.decodeAny(true), 'Expected 5 but got true');
      expectError(decoder.decodeAny(null), 'Expected 5 but got null');
      expectError(decoder.decodeAny(undefined), 'Expected 5 but got undefined');
      expectError(decoder.decodeAny({}), 'Expected 5 but got {}');
      expectError(decoder.decodeAny([]), 'Expected 5 but got []');
    });
  });
});

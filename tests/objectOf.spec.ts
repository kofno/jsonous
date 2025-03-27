import { describe, expect, it } from 'bun:test';
import { Result } from 'resulty';
import { objectOf } from '../src/associative';
import { boolean, number, string } from '../src/base';
import { InferType } from '../src/types';

// Helper function to check for errors
function expectError<T>(result: Result<string, T>, expectedError: string) {
  result.cata({
    Err: (e) => expect(e).toBe(expectedError),
    Ok: () => {
      console.error('Expected error but got success:', result);
      expect(true).toBe(false);
    },
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
  describe('objectOf', () => {
    // Example usage with string values (like DecadeDataRow)
    const decadeDataRowDecoder = objectOf(string);
    type DecadeDataRow = InferType<typeof decadeDataRowDecoder>;

    // Example usage with number values
    const numberObjectDecoder = objectOf(number);
    type NumberObject = InferType<typeof numberObjectDecoder>;

    // Example usage with boolean values
    const booleanObjectDecoder = objectOf(boolean);
    type BooleanObject = InferType<typeof booleanObjectDecoder>;

    it('should succeed with a valid DecadeDataRow', () => {
      const validData: DecadeDataRow = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      expectSuccess(decadeDataRowDecoder.decodeAny(validData), validData);
    });

    it('should fail with a non-object', () => {
      expectError(
        decadeDataRowDecoder.decodeAny('hello'),
        'I expected to find an object but instead found \'"hello"\''
      );
      expectError(
        decadeDataRowDecoder.decodeAny(123),
        "I expected to find an object but instead found '123'"
      );
      expectError(
        decadeDataRowDecoder.decodeAny(true),
        "I expected to find an object but instead found 'true'"
      );
      expectError(
        decadeDataRowDecoder.decodeAny(null),
        "I expected to find an object but instead found 'null'"
      );
      expectError(
        decadeDataRowDecoder.decodeAny(undefined),
        "I expected to find an object but instead found 'undefined'"
      );
      expectError(
        decadeDataRowDecoder.decodeAny([]),
        "I expected to find an object but instead found '[]'"
      );
    });

    it('should fail if a value is not a string', () => {
      expectError(
        decadeDataRowDecoder.decodeAny({ key1: 123 }),
        'I expected the value for key "key1" to be a valid value, but found: 123'
      );
      expectError(
        decadeDataRowDecoder.decodeAny({ key1: true }),
        'I expected the value for key "key1" to be a valid value, but found: true'
      );
      expectError(
        decadeDataRowDecoder.decodeAny({ key1: null }),
        'I expected the value for key "key1" to be a valid value, but found: null'
      );
      expectError(
        decadeDataRowDecoder.decodeAny({ key1: undefined }),
        'I expected the value for key "key1" to be a valid value, but found: undefined'
      );
      expectError(
        decadeDataRowDecoder.decodeAny({ key1: {} }),
        'I expected the value for key "key1" to be a valid value, but found: {}'
      );
      expectError(
        decadeDataRowDecoder.decodeAny({ key1: [] }),
        'I expected the value for key "key1" to be a valid value, but found: []'
      );
    });

    it('should succeed with a valid NumberObject', () => {
      const validData: NumberObject = {
        key1: 1,
        key2: 2,
        key3: 3,
      };
      expectSuccess(numberObjectDecoder.decodeAny(validData), validData);
    });

    it('should fail if a value is not a number', () => {
      expectError(
        numberObjectDecoder.decodeAny({ key1: '123' }),
        'I expected the value for key "key1" to be a valid value, but found: "123"'
      );
    });

    it('should succeed with a valid BooleanObject', () => {
      const validData: BooleanObject = {
        key1: true,
        key2: false,
        key3: true,
      };
      expectSuccess(booleanObjectDecoder.decodeAny(validData), validData);
    });

    it('should fail if a value is not a boolean', () => {
      expectError(
        booleanObjectDecoder.decodeAny({ key1: 'true' }),
        'I expected the value for key "key1" to be a valid value, but found: "true"'
      );
    });
  });
});

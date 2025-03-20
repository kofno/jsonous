import { describe, expect, it } from 'bun:test';
import { Result } from 'resulty';
import { date, dateISO, dateJSON } from '../src/dates';

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

describe('dates', () => {
  describe('date', () => {
    it('should decode a valid date string', () => {
      const dateStr = '2023-10-27';
      const expectedDate = new Date(dateStr);
      expectSuccess(date.decodeAny(dateStr), expectedDate);
    });

    it('should fail with an invalid date string', () => {
      expectError(
        date.decodeAny('not a date'),
        'I expected a date but instead I found "not a date"'
      );
    });

    it('should fail with an invalid date number', () => {
      expectError(date.decodeAny(NaN), 'I expected a date but instead I found null');
    });

    it('should fail with a non-date value', () => {
      expectError(date.decodeAny(true), 'I expected a date but instead I found true');
      expectError(date.decodeAny({}), 'I expected a date but instead I found {}');
      expectError(date.decodeAny([]), 'I expected a date but instead I found []');
      expectError(date.decodeAny(null), 'I expected a date but instead I found null');
      expectError(date.decodeAny(undefined), 'I expected a date but instead I found undefined');
    });
  });

  describe('dateISO', () => {
    it('should decode a valid ISO date string', () => {
      const dateStr = '2023-10-27T10:00:00Z';
      const expectedDate = new Date(dateStr);
      expectSuccess(dateISO.decodeAny(dateStr), expectedDate);
    });

    it('should decode a valid ISO date string without time', () => {
      const dateStr = '2023-10-27';
      const expectedDate = new Date(dateStr);
      expectSuccess(dateISO.decodeAny(dateStr), expectedDate);
    });

    it('should fail with an invalid ISO date string', () => {
      expectError(
        dateISO.decodeAny('not a date'),
        'I expected an ISO date but instead I found "not a date"'
      );
    });

    it('should fail with a non-string value', () => {
      expectError(
        dateISO.decodeAny(1672531200000),
        'I expected to find a string but instead I found 1672531200000'
      );
      expectError(dateISO.decodeAny(true), 'I expected to find a string but instead I found true');
      expectError(dateISO.decodeAny({}), 'I expected to find a string but instead I found {}');
      expectError(dateISO.decodeAny([]), 'I expected to find a string but instead I found []');
      expectError(dateISO.decodeAny(null), 'I expected to find a string but instead I found null');
      expectError(
        dateISO.decodeAny(undefined),
        'I expected to find a string but instead I found undefined'
      );
    });
  });

  describe('dateJSON', () => {
    it('should decode a valid JSON date string with milliseconds', () => {
      const dateStr = '2023-10-27T10:00:00.123Z';
      const expectedDate = new Date(dateStr);
      expectSuccess(dateJSON.decodeAny(dateStr), expectedDate);
    });

    it('should decode a valid JSON date string without milliseconds', () => {
      const dateStr = '2023-10-27T10:00:00Z';
      const expectedDate = new Date(dateStr);
      expectSuccess(dateJSON.decodeAny(dateStr), expectedDate);
    });

    it('should fail with a valid ISO date string without time', () => {
      const dateStr = '2023-10-27';
      expectError(
        dateJSON.decodeAny(dateStr),
        'I expected an JSON date but instead I found "2023-10-27"'
      );
    });

    it('should fail with an invalid JSON date string', () => {
      expectError(
        dateJSON.decodeAny('not a date'),
        'I expected an JSON date but instead I found "not a date"'
      );
    });

    it('should fail with a non-string value', () => {
      expectError(
        dateJSON.decodeAny(1672531200000),
        'I expected to find a string but instead I found 1672531200000'
      );
      expectError(dateJSON.decodeAny(true), 'I expected to find a string but instead I found true');
      expectError(dateJSON.decodeAny({}), 'I expected to find a string but instead I found {}');
      expectError(dateJSON.decodeAny([]), 'I expected to find a string but instead I found []');
      expectError(dateJSON.decodeAny(null), 'I expected to find a string but instead I found null');
      expectError(
        dateJSON.decodeAny(undefined),
        'I expected to find a string but instead I found undefined'
      );
    });
  });
});

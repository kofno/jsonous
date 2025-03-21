import { Result, err, ok } from 'resulty';
import { describe, expect, it } from 'bun:test';
import { regex } from '../src/strings';

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

describe('regex', () => {
  it('should succeed if the string matches the regex', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result = emailDecoder.decodeAny('test@example.com').map((s) => s[0]);
    expectSuccess(result, 'test@example.com');
  });

  it('should fail if the string does not match the regex', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny('invalid-email');
    expectError(
      result,
      `The string \"invalid-email\" does not match the regular expression: /^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/`
    );
  });

  it('should handle empty strings', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny('');
    expectError(
      result,
      `The string \"\" does not match the regular expression: /^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/`
    );
  });

  it('should handle null values', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny(null);
    expectError(result, `Expected a string, but received: null`);
  });

  it('should handle undefined values', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny(undefined);
    expectError(result, `Expected a string, but received: undefined`);
  });

  it('should handle numbers', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny(123);
    expectError(result, `Expected a string, but received: 123`);
  });

  it('should handle booleans', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny(true);
    expectError(result, `Expected a string, but received: true`);
  });

  it('should handle objects', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny({});
    expectError(result, `Expected a string, but received: {}`);
  });

  it('should handle arrays', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny([]);
    expectError(result, `Expected a string, but received: []`);
  });

  it('should handle functions', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny(() => {});
    expectError(result, `Expected a string, but received: undefined`);
  });

  it('should handle global regex', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    const emailDecoder = regex(emailRegex);
    const result = emailDecoder.decodeAny('test@example.com').map((s) => s[0]);
    expectSuccess(result, 'test@example.com');
  });

  it('should handle case-insensitive regex', () => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i;
    const emailDecoder = regex(emailRegex);
    const result = emailDecoder.decodeAny('TEST@EXAMPLE.COM').map((s) => s[0]);
    expectSuccess(result, 'TEST@EXAMPLE.COM');
  });

  it('should handle multiple matches', () => {
    const emailRegex = /(\w+)/g;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, string> = emailDecoder
      .decodeAny('test test test')
      .map((s) => s[0]);
    expectSuccess(result, 'test');
  });

  it('should handle no matches', () => {
    const emailRegex = /(\w+)/g;
    const emailDecoder = regex(emailRegex);
    const result: Result<string, RegExpExecArray> = emailDecoder.decodeAny('   ');
    expectError(result, `The string \"   \" does not match the regular expression: /(\\w+)/g`);
  });
});

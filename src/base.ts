import { err, ok } from 'resulty';
import Decoder from './Decoder';
import { safeStringify } from './utils';

/**
 * Creates a decoder that always succeeds with the given value.
 *
 * @template A - The type of the value to be returned by the decoder.
 * @param value - The value to be returned by the decoder.
 * @returns A new decoder that always returns the provided value.
 */
export const succeed = <A>(value: A) => new Decoder((_) => ok(value));

/**
 * Creates a decoder that always fails with the given message.
 *
 * @template A - The type of the value to be returned by the decoder.
 * @param message - The error message to be returned by the decoder.
 * @returns A new decoder that always fails with the provided message.
 */
export const fail = <A>(message: string): Decoder<A> => new Decoder((_) => err(message));

/**
 * A decoder that validates if a given value is a string.
 *
 * @constant
 * @type {Decoder<string>}
 *
 * @example
 * const result = string.decode("hello");
 * // result is Ok("hello")
 *
 * const result = string.decode(123);
 * // result is Err("I expected to find a string but instead I found 123")
 *
 * @param {any} value - The value to be decoded.
 * @returns {Result<string, string>} - Returns an Ok with the string value if the value is a string,
 * otherwise returns an Err with an error message.
 */
export const string: Decoder<string> = new Decoder<string>((value) => {
  if (typeof value !== 'string') {
    const stringified = safeStringify(value);
    const errorMsg = `I expected to find a string but instead I found ${stringified}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * A decoder that validates if a given value is a number.
 *
 * This decoder checks the type of the input value. If the value is not a number,
 * it returns an error with a message indicating the expected type and the actual value.
 * If the value is a number, it returns the value wrapped in an `ok` result.
 *
 * @constant
 * @type {Decoder<number>}
 * @example
 * const result = number.decode(42); // ok(42)
 * const result = number.decode("42"); // err("I expected to find a number but instead I found \"42\"")
 */
export const number: Decoder<number> = new Decoder<number>((value) => {
  if (typeof value !== 'number') {
    const errorMsg = `I expected to find a number but instead I found ${safeStringify(value)}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * A decoder that validates if a given value is a boolean.
 *
 * @constant
 * @type {Decoder<boolean>}
 * @example
 * const result = boolean.decode(true); // ok(true)
 * const result = boolean.decode("true"); // err("I expected to find a boolean but instead I found \"true\"")
 */
export const boolean: Decoder<boolean> = new Decoder<boolean>((value) => {
  if (typeof value !== 'boolean') {
    const errorMsg = `I expected to find a boolean but instead found ${safeStringify(value)}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Creates a decoder that checks if the input value is equal to the specified value.
 *
 * @typeParam T - The type of the value to compare.
 * @param t - The value to compare against the input.
 * @returns A `Decoder` that succeeds if the input value is equal to `t`, otherwise fails with an error message.
 */
export const eql = <T>(t: T): Decoder<T> =>
  new Decoder<T>((v) => {
    return t === v ? ok(v) : err(`Expected ${t} but got ${safeStringify(v)}`);
  });

/**
 * Creates a decoder that checks if the input is equal to the specified string literal.
 *
 * @template T - The type of the string literal.
 * @param t - The string literal to compare against.
 * @returns A decoder that validates if the input matches the string literal.
 */
export const stringLiteral = <T extends string>(t: T): Decoder<T> => eql<T>(t);

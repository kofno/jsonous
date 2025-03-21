import { err, ok } from 'resulty';
import Decoder from './Decoder';
import { safeStringify } from './utils';

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

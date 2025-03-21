import { err, ok } from 'resulty';
import Decoder from './Decoder';
import { safeStringify } from './utils';

/**
 * Creates a decoder that validates if a string matches a given regular expression.
 *
 * @param regex - The regular expression to test against the input string.
 * @returns A `Decoder` that checks if the input string matches the provided regular expression.
 *
 * The decoder will return:
 * - `ok(RegExpExecArray)` if the input string matches the regular expression.
 * - `err(string)` if the input is not a string or does not match the regular expression.
 *
 * @example
 * ```typescript
 * const emailDecoder = regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
 * const result = emailDecoder.decode("example@example.com");
 * // result is ok(["example@example.com"])
 *
 * const invalidResult = emailDecoder.decode("invalid-email");
 * // invalidResult is err('The string "invalid-email" does not match the regular expression: /^[^\s@]+@[^\s@]+\.[^\s@]+$/')
 * ```
 */
export const regex = (regex: RegExp): Decoder<RegExpExecArray> =>
  new Decoder((value) => {
    // Explicitly handle null and undefined values
    if (value === null || value === undefined) {
      return err(`Expected a string, but received: ${safeStringify(value)}`);
    }

    if (typeof value !== 'string') {
      return err(`Expected a string, but received: ${safeStringify(value)}`);
    }

    const match = regex.exec(value);
    if (match) {
      return ok(match);
    } else {
      return err(
        `The string "${value}" does not match the regular expression: ${regex.toString()}`
      );
    }
  });

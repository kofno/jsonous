import { err, ok, Result } from 'resulty';
import Decoder from './Decoder';
import { safeStringify } from './utils';

/**
 * Converts a JSON object to an array of key value pairs ((string, A)[]). The
 * passed in decoder is applied to the object value. The key will always be
 * converted to a string.
 *
 * @param decoder The internal decoder to be applied to the object values
 */
export const keyValuePairs = <A>(decoder: Decoder<A>): Decoder<[string, A][]> =>
  new Decoder((value) => {
    if (typeof value !== 'object' || value === null || value instanceof Array) {
      return err<string, [string, A][]>(
        `Expected to find an object and instead found '${safeStringify(value)}'`
      );
    }

    return Object.keys(value).reduce(
      (memo, key) =>
        memo.andThen((pairs) =>
          decoder
            .decodeAny(value[key])
            .mapError((err) => `Key '${key}' failed to decode: ${err}`)
            .map((v) => pairs.concat([[key, v]]))
        ),
      ok([]) as Result<string, [string, A][]>
    );
  });

/**
 * Converts a JSON object to a Map<string, A>.
 *
 * I would reccomend using this as a decoder of last resort. For correctness, you are
 * probably better off using field decoders and explicitly declaring the shape of the
 * objects you are expecting.
 *
 * @param decoder The internal decoder to be applied to the object values
 */
export const dict = <A>(decoder: Decoder<A>): Decoder<Map<string, A>> =>
  keyValuePairs(decoder).map((pairs) =>
    pairs.reduce((memo, [key, value]) => {
      memo.set(key, value);
      return memo;
    }, new Map<string, A>())
  );

/**
 * Creates a decoder for objects where all keys are strings and all values
 * conform to a specific type.
 *
 * This function is a higher-order decoder factory. It takes a `valueDecoder`
 * as an argument, which is responsible for decoding the individual values
 * within the object. The `objectOf` function then creates a new decoder that
 * can decode an entire object, ensuring that all keys are strings and all
 * values are successfully decoded by the provided `valueDecoder`.
 *
 * @param valueDecoder - A decoder that will be used to decode each value
 *   within the object. This decoder determines the type of the values in the
 *   resulting object.
 * @returns A decoder that can decode objects with string keys and values
 *   of the type specified by `valueDecoder`.
 *
 * @example
 * ```typescript
 * import { string, number, objectOf } from './associative'; // Assuming these are in the same file
 * import { InferType } from './base'; // Assuming InferType is defined in base.ts
 *
 * // Decoder for an object where values are strings
 * const stringObjectDecoder = objectOf(string);
 * type StringObject = InferType<typeof stringObjectDecoder>;
 *
 * // Decoder for an object where values are numbers
 * const numberObjectDecoder = objectOf(number);
 * type NumberObject = InferType<typeof numberObjectDecoder>;
 *
 * // Example usage
 * const validStringObject: StringObject = { a: 'hello', b: 'world' };
 * const validNumberObject: NumberObject = { x: 1, y: 2, z: 3 };
 *
 * // Example of invalid data
 * const invalidStringObject = { a: 'hello', b: 123 }; // Error: 'b' is not a string
 * const invalidNumberObject = { x: 1, y: '2', z: 3 }; // Error: 'y' is not a number
 * ```
 */
export function objectOf<T>(valueDecoder: Decoder<T>): Decoder<{ [key: string]: T }> {
  return new Decoder<{ [key: string]: T }>((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return err(`I expected to find an object but instead found '${safeStringify(value)}'`);
    }

    const result: { [key: string]: T } = {};
    for (const key of Object.keys(value)) {
      const decodedValue = valueDecoder.decodeAny(value[key]);
      if (decodedValue.state.kind === 'err') {
        return err(
          `I expected the value for key "${key}" to be a valid value, but found: ${safeStringify(
            value[key]
          )}`
        );
      }
      result[key] = decodedValue.state.value;
    }
    return ok(result);
  });
}

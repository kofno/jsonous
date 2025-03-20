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

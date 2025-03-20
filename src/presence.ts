import { just, Maybe, nothing } from 'maybeasy';
import { ok } from 'resulty';
import Decoder from './Decoder';

/**
 * Makes any decoder optional. Be aware that this can mask a failing
 * decoder because it makes any failed decoder result a nothing.
 */
export const maybe = <A>(decoder: Decoder<A>): Decoder<Maybe<A>> =>
  new Decoder((value) => {
    return decoder.decodeAny(value).cata({
      Err: (e) => ok(nothing()),
      Ok: (v) => ok(just(v)),
    });
  });

/**
 * Decodes possibly null or undefined values into types.
 * There is overlap between `nullable` and `maybe` decoders.
 * The difference is that `maybe` will always succeed, even if
 * there is an error in the decoder.
 *
 * Maybe example:
 *
 *     maybe(string).decodeAny('foo') // => Ok('foo')
 *     maybe(string).decodeAny(null)  // => Ok(Nothing)
 *     maybe(string).decodeAny(42)    // => Ok(Nothing)
 *
 * Nullable example:
 *
 *     nullable(string).decodeAny('foo') // => Ok('foo')
 *     nullable(string).decodeAny(null)  // => Ok(Nothing)
 *     nullable(string).decodeAny(42)    // => Err...
 */
export const nullable = <A>(decoder: Decoder<A>): Decoder<Maybe<A>> =>
  new Decoder((value) => {
    if (value == null) {
      return ok(nothing());
    }
    return decoder.decodeAny(value).map(just);
  });

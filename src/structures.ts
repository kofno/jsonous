import { err, Result } from 'resulty';
import Decoder from './Decoder';
import { succeed } from './base';
import { field } from './containers';
import { identity } from './utils';

/**
 * Creates a decoder that tries to decode a value using a list of provided decoders.
 * If none of the decoders succeed, it returns an error with a combined message of all errors.
 *
 * @template A - The type of the value to decode.
 * @param {Array<Decoder<A>>} decoders - An array of decoders to try.
 * @returns {Decoder<A>} A decoder that tries each provided decoder in order.
 */
export function oneOf<A>(decoders: Decoder<A>[]): Decoder<A> {
  return new Decoder((value) => {
    if (decoders.length === 0) {
      return err<string, A>('No decoders specified.');
    }

    const results = decoders.map((decoder) => decoder.decodeAny(value));
    const errors = results
      .filter((r) => r.isErr())
      .map((r) => r.cata({ Err: (e) => e, Ok: () => '' }));

    if (results.some((r) => r.isOk())) {
      return results.find((r) => r.isOk()) as Result<string, A>;
    }

    return err<string, A>(`I found the following problems:\n${errors.join('\n')}`);
  });
}

/**
 * Creates a decoder from a given structure of decoders or nested structures.
 *
 * This function takes a structure where each value is either a `Decoder` or another
 * nested structure of decoders, and returns a `Decoder` that can decode objects
 * matching the given structure.
 *
 * @template T - The type of the structure, which is a record where each value is either
 * a `Decoder` or another nested structure.
 *
 * @param {T} structure - The structure of decoders or nested structures.
 *
 * @returns {Decoder<InferStructure<T>>} - A decoder that can decode objects matching the given structure.
 */
export function createDecoderFromStructure<T extends Structure>(
  structure: T,
  keyToLookup: (key: string) => string = identity
): Decoder<InferStructure<T>> {
  return Object.entries(structure).reduce((acc, [key, decoderOrStructure]) => {
    const decoder = isDecoder(decoderOrStructure)
      ? field(keyToLookup(key), decoderOrStructure)
      : field(keyToLookup(key), createDecoderFromStructure(decoderOrStructure));
    return acc.assign(key, decoder);
  }, succeed({}) as Decoder<any>);
}

function isDecoder(value: any): value is Decoder<any> {
  return value instanceof Decoder;
}

type Structure = { [key: string]: Decoder<any> | Structure };

type InferStructure<T extends Structure> = {
  [K in keyof T]: T[K] extends Decoder<infer U>
    ? U
    : T[K] extends Structure
    ? InferStructure<T[K]>
    : never;
};

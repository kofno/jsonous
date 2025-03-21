import { err, Result } from 'resulty';
import Decoder from './Decoder';
import { succeed } from './base';
import { field } from './containers';
import { identity } from './utils';
import { eql } from './predicates';

/**
 * Creates a decoder that checks if the input is equal to the specified string literal.
 *
 * @template T - The type of the string literal.
 * @param t - The string literal to compare against.
 * @returns A decoder that validates if the input matches the string literal.
 */
export const stringLiteral = <T extends string>(t: T): Decoder<T> => eql<T>(t);

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

/**
 * Checks if the provided value is an instance of the Decoder class.
 *
 * @param value - The value to check.
 * @returns A boolean indicating whether the value is a Decoder instance.
 */
function isDecoder(value: any): value is Decoder<any> {
  return value instanceof Decoder;
}

/**
 * Represents a structure where each key is associated with either a `Decoder` of any type or another nested `Structure`.
 * This allows for the creation of complex, nested data structures that can be decoded.
 *
 * @typeParam key - The key of the structure, which is a string.
 * @typeParam Decoder - A generic type representing a decoder for any type.
 */
type Structure = { [key: string]: Decoder<any> | Structure };

/**
 * Infers the TypeScript type from a given `Structure` type.
 *
 * This utility type recursively maps over the keys of the `Structure` type `T`
 * and infers the corresponding TypeScript type for each key.
 *
 * - If the value of a key is a `Decoder` type, it infers the type `U` that the `Decoder` decodes to.
 * - If the value of a key is another `Structure`, it recursively infers the structure of that nested `Structure`.
 * - Otherwise, it results in `never`.
 *
 * @template T - The `Structure` type from which to infer the TypeScript type.
 */
type InferStructure<T extends Structure> = {
  [K in keyof T]: T[K] extends Decoder<infer U>
    ? U
    : T[K] extends Structure
    ? InferStructure<T[K]>
    : never;
};

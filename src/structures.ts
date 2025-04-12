import { err, Result } from 'resulty';
import Decoder from './Decoder';
import { string, succeed } from './base';
import { field } from './containers';
import { identity, safeStringify } from './utils';
import { eql } from './predicates';
import { InferType } from './types';

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

// Helper type to infer the union type from the mapping values
type InferUnionFromMapping<T extends { [K in string]: Decoder<any> }> = {
  [K in keyof T]: InferType<T[K]>;
}[keyof T]; // This extracts the types of all decoders in the mapping and creates a union

/**
 * Creates a decoder for a discriminated union type. A discriminated union is a union of object types
 * where each object type is identified by a specific value in a shared discriminator field.
 *
 * @template DiscriminatorKey - The name of the discriminator field (e.g., `'type'`).
 * @template Mapping - A mapping object where keys are discriminator values and values are decoders
 *                     for the corresponding object types.
 *
 * @param discriminatorField - The name of the field used to discriminate between union variants.
 * @param mapping - An object mapping discriminator values to their respective decoders.
 *
 * @returns A `Decoder` that decodes values into the appropriate union variant based on the discriminator field.
 *
 * @throws If the discriminator field is missing, has an invalid value, or if the value does not match
 *         any key in the mapping, an error is returned.
 *
 * @example
 * ```typescript
 * const userDecoder = object({ type: stringLiteral('user'), name: string });
 * const adminDecoder = object({ type: stringLiteral('admin'), permissions: array(string) });
 *
 * const unionDecoder = discriminatedUnion('type', {
 *   user: userDecoder,
 *   admin: adminDecoder,
 * });
 *
 * const result = unionDecoder.decode({
 *   type: 'user',
 *   name: 'Alice',
 * });
 * // result: { type: 'user', name: 'Alice' }
 * ```
 */
export function discriminatedUnion<
  DiscriminatorKey extends string, // The name of the discriminator field (e.g., 'type')
  Mapping extends { [K in string]: Decoder<any> } // The map from discriminator value to decoder
>(discriminatorField: DiscriminatorKey, mapping: Mapping): Decoder<InferUnionFromMapping<Mapping>> {
  // Return type is the union of all variant types

  // Pre-decode the discriminator field to check its type (usually string)
  const discriminatorDecoder = field(discriminatorField, string); // Assuming string discriminator

  return new Decoder((value) => {
    // 1. Decode the discriminator value first
    const discriminatorResult = discriminatorDecoder.decodeAny(value);

    if (discriminatorResult.state.kind === 'err') {
      // Error if the discriminator field is missing or not a string
      return err(
        `Missing or invalid discriminator field '${discriminatorField}' in ${safeStringify(value)}`
      );
    }

    const discriminatorValue = discriminatorResult.state.value; // e.g., 'user', 'admin'

    // 2. Find the corresponding decoder in the mapping
    const selectedDecoder = mapping[discriminatorValue];

    if (!selectedDecoder) {
      // Error if the discriminator value doesn't match any key in the mapping
      const knownTypes = Object.keys(mapping).join(', ');
      return err(
        `Unexpected discriminator value '${discriminatorValue}' for field '${discriminatorField}'. Expected one of: ${knownTypes}. Found in: ${safeStringify(
          value
        )}`
      );
    }

    // 3. Apply the selected decoder to the original value
    // We apply it to the whole value, assuming the variant decoder expects the discriminator field too
    // (which is common if using createDecoderFromStructure with stringLiteral)
    return selectedDecoder
      .decodeAny(value)
      .mapError(
        (e) => `Error decoding variant with ${discriminatorField}='${discriminatorValue}': ${e}`
      );
  });
}

import { Result } from 'resulty';
import Decoder from './Decoder';

/**
 * Infers the resulting type of a Decoder.
 *
 * This type utility takes a Decoder type and extracts the type it decodes to.
 *
 * @template D - The Decoder type.
 * @returns The type that the Decoder decodes to.
 */
export type InferType<D extends Decoder<any>> = D extends Decoder<infer T> ? T : never;

/**
 * Infers the resulting type of a Decoder function.
 *
 * This type utility takes a Decoder function and extracts the type it decodes to.
 *
 * @template F - The Decoder function type.
 * @returns The type that the Decoder function decodes to.
 */
export type InferTypeFromFn<F extends (value: any) => Result<string, any>> = F extends (
  value: any
) => Result<string, infer T>
  ? T
  : never;

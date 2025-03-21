import { err, Result } from 'resulty';
import { safeStringify } from './utils';

/**
 * A function type that represents a decoder which takes an input of any type
 * and returns a `Result` containing either a string error message or a value of type `A`.
 *
 * @template A - The type of the successfully decoded value.
 * @param thing - The input value to be decoded.
 * @returns A `Result` object containing either a string error message or a value of type `A`.
 */
export type DecoderFn<A> = (thing: any) => Result<string, A>;

/**
 * A class representing a Decoder that can be used to decode values of type `A`.
 *
 * @template A - The type of the value that this decoder will decode.
 */
export default class Decoder<A> {
  /**
   * The constructor for the Decoder class.
   *
   * @param fn - The decoder function that will be used to decode values of type `A`.
   */
  constructor(private fn: DecoderFn<A>) {}

  /**
   * Transforms the output of this decoder using the provided function.
   *
   * @template B - The type of the output after applying the transformation function.
   * @param {function(A): B} f - A function that takes a value of type A and returns a value of type B.
   * @returns {Decoder<B>} A new decoder that applies the transformation function to the output of this decoder.
   */
  public map = <B>(f: (a: A) => B): Decoder<B> => {
    return new Decoder((value) => {
      return this.fn(value).map(f);
    });
  };

  /**
   * Chains the current decoder with another decoder that depends on the result of the current decoder.
   *
   * @template B - The type of the value that the resulting decoder will decode to.
   * @param f - A function that takes the result of the current decoder and returns a new decoder.
   * @returns A new decoder that first decodes the value using the current decoder,
   *          and then uses the result to decode further using the provided function.
   */
  public andThen = <B>(f: (a: A) => Decoder<B>): Decoder<B> => {
    return new Decoder((value) => {
      return this.fn(value).andThen((v) => f(v).decodeAny(value));
    });
  };

  /**
   * Assigns a new key-value pair to the decoded object.
   *
   * The idea for assign came from this blog:
   * https://medium.com/@dhruvrajvanshi/simulating-haskells-do-notation-in-typescript-e48a9501751c
   *
   * @template K - The type of the key to be added.
   * @template B - The type of the value to be added.
   * @param {K} k - The key to be added to the decoded object.
   * @param {Decoder<B> | ((a: A) => Decoder<B>)} other - A decoder for the value to be added, or a function that takes the current decoded object and returns a decoder for the value.
   * @returns {Decoder<A & { [k in K]: B }>} A new decoder that decodes an object with the new key-value pair added.
   */
  public assign = <K extends string, B>(
    k: K,
    other: Decoder<B> | ((a: A) => Decoder<B>)
  ): Decoder<A & { [k in K]: B }> => {
    return this.andThen((a) => {
      const decoder = other instanceof Decoder ? other : other(a);
      return decoder.map<A & { [k in K]: B }>((b) => ({
        ...Object(a),
        [k.toString()]: b,
      }));
    });
  };

  /**
   * Applies a given function to the decoded value and returns the original value.
   *
   * @param fn - A function that takes the decoded value as an argument and performs some operation on it.
   * @returns A new Decoder instance with the same value.
   */
  public do = (fn: (a: A) => void): Decoder<A> => {
    return this.map((v) => {
      fn(v);
      return v;
    });
  };

  /**
   * Transforms the error message of the decoder using the provided function.
   *
   * @param f - A function that takes an error message string and returns a transformed error message string.
   * @returns A new `Decoder` instance with the transformed error message.
   */
  public mapError = (f: (e: string) => string): Decoder<A> => {
    return new Decoder((value) => {
      return this.fn(value).mapError(f);
    });
  };

  /**
   * Provides an alternative decoder to use if the current decoder fails.
   *
   * @param f - A function that takes an error message and returns an alternative decoder.
   * @returns A new decoder that attempts to decode the value using the current decoder,
   *          and if it fails, uses the alternative decoder provided by the function `f`.
   */
  public orElse = (f: (e: string) => Decoder<A>): Decoder<A> => {
    return new Decoder((value) => {
      return this.fn(value).orElse((e) => f(e).decodeAny(value));
    });
  };

  /**
   * Registers a callback function to be executed if the decoding process fails.
   *
   * @param f - A function that takes an error message as a parameter and returns void.
   * @returns A new `Decoder` instance with the registered callback function.
   */
  public elseDo = (f: (e: string) => void): Decoder<A> => {
    return new Decoder((value) => {
      return this.fn(value).elseDo(f);
    });
  };

  /**
   * Decodes any given value using the provided decoding function.
   *
   * @param value - The value to be decoded.
   * @returns The result of the decoding function applied to the given value.
   */
  public decodeAny = (value: any) => this.fn(value);

  /**
   * Decodes a JSON string into a Result type.
   *
   * @param json - The JSON string to decode.
   * @returns A Result containing either the decoded value of type `A` or an error message.
   *
   * @template A - The type of the decoded value.
   */
  public decodeJson = (json: string): Result<string, A> => {
    try {
      const value = JSON.parse(json);
      return this.decodeAny(value);
    } catch (e) {
      if (e instanceof Error) {
        return err(e.message);
      } else if (typeof e === 'string') {
        return err(e);
      }
      return err(safeStringify(e));
    }
  };

  /**
   * Converts the current decoder into a function that can decode any value.
   *
   * @returns A function that takes any value and returns a `Result` containing either a string error message or a decoded value of type `A`.
   */
  public toAnyFn = (): ((value: any) => Result<string, A>) => {
    return (value: any) => this.decodeAny(value);
  };

  /**
   * Converts the current decoder into a function that takes a JSON string
   * and returns a `Result` containing either a decoded value of type `A` or an error message.
   *
   * @returns A function that takes a JSON string and returns a `Result<string, A>`.
   */
  public toJsonFn = (): ((json: string) => Result<string, A>) => {
    return (json: string) => this.decodeJson(json);
  };
}

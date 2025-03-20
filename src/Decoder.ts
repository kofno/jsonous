import { err, Result } from 'resulty';
import { safeStringify } from './utils';

/**
 * A decoder function takes an object of any type and returns a Result
 */
export type DecoderFn<A> = (thing: any) => Result<string, A>;

/**
 * A Decoder represents a value that can be converted to a known type, either
 * from JSON or from an <any> typed object.
 */
export default class Decoder<A> {
  constructor(private fn: DecoderFn<A>) {}

  /**
   * Lifts any function up to operate on the value in the Decoder context.
   */
  public map = <B>(f: (a: A) => B): Decoder<B> => {
    return new Decoder((value) => {
      return this.fn(value).map(f);
    });
  };

  /**
   * Chains decoders together. Can be used when the value from a decoder is
   * needed to decode the rest of the data. For example, if you have a versioned
   * api, you can check the version number and then select an appropriate decoder
   * for the rest of the data.
   *
   * Also, chaining decoders is one way to build new types from decoded objects.
   */
  public andThen = <B>(f: (a: A) => Decoder<B>): Decoder<B> => {
    return new Decoder((value) => {
      return this.fn(value).andThen((v) => f(v).decodeAny(value));
    });
  };

  /**
   * This is a special case of chaining. Like `andThen`, `assign` allows you
   * to combine several decoders. With `assign`, we build up an object (or scope)
   * internally. THe benefit is that is allows you to avoid and the nesting
   * and callback hell typically associated with using `andThen` to build objects.
   *
   * The idea for assign came from this blog:
   * https://medium.com/@dhruvrajvanshi/simulating-haskells-do-notation-in-typescript-e48a9501751c
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
   * Inject a side-effectual operation in the middle of a Decoder chain.
   * This is a convenient mechanism for debugging decoders using console logging.
   * I don't reccomend using this mechanusm for making API calls, or anything complex
   * like that.
   */
  public do = (fn: (a: A) => void): Decoder<A> => {
    return this.map((v) => {
      fn(v);
      return v;
    });
  };

  /**
   * If a decoder fails, map over the failure message.
   */
  public mapError = (f: (e: string) => string): Decoder<A> => {
    return new Decoder((value) => {
      return this.fn(value).mapError(f);
    });
  };

  /**
   * If a decoder fails, use an alternative decoder.
   */
  public orElse = (f: (e: string) => Decoder<A>): Decoder<A> => {
    return new Decoder((value) => {
      return this.fn(value).orElse((e) => f(e).decodeAny(value));
    });
  };

  /**
   * If a decoder fails, do something side-effectual
   */
  public elseDo = (f: (e: string) => void): Decoder<A> => {
    return new Decoder((value) => {
      return this.fn(value).elseDo(f);
    });
  };

  /**
   * Run the current decoder on any value
   */
  public decodeAny = (value: any) => this.fn(value);

  /**
   * Parse the json string and run the current decoder on the resulting
   * value. Parse errors are returned in an Result.Err, as with any decoder
   * error.
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
   * Returns a function that runs this docoder over any value when called.
   * This is a convenient way to convert a decoder into a callback.
   */
  public toAnyFn = (): ((value: any) => Result<string, A>) => {
    return (value: any) => this.decodeAny(value);
  };

  /**
   * Returns a function that runs this decoder over a JSON string when called.
   * This is a convenient way to convert a decoder into a callback.
   */
  public toJsonFn = (): ((json: string) => Result<string, A>) => {
    return (json: string) => this.decodeJson(json);
  };
}

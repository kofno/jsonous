import { Maybe, just, nothing } from 'maybeasy';
import { Result, err, ok } from 'resulty';

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
  public map<B>(f: (a: A) => B): Decoder<B> {
    return new Decoder(value => {
      return this.fn(value).map(f);
    });
  }

  /**
   * Chains decoders together. Can be used when the value from a decoder is
   * needed to decode the rest of the data. For example, if you have a versioned
   * api, you can check the version number and then select an appropriate decoder
   * for the rest of the data.
   *
   * Also, chaining decoders is one way to build new types from decoded objects.
   */
  public andThen<B>(f: (a: A) => Decoder<B>): Decoder<B> {
    return new Decoder(value => {
      return this.fn(value).andThen(v => f(v).decodeAny(value));
    });
  }

  /**
   * This is a special case of chaining. Like `andThen`, `assign` allows you
   * to combine several decoders. With `assign`, we build up an object (or scope)
   * internally. THe benefit is that is allows you to avoid and the nesting
   * and callback hell typically associated with using `andThen` to build objects.
   *
   * The idea for assign came from this blog:
   * https://medium.com/@dhruvrajvanshi/simulating-haskells-do-notation-in-typescript-e48a9501751c
   */
  public assign<K extends string, B>(
    k: K,
    other: Decoder<B> | ((a: A) => Decoder<B>),
  ): Decoder<A & { [k in K]: B }> {
    return this.andThen(a => {
      const decoder = other instanceof Decoder ? other : other(a);
      return decoder.map<A & { [k in K]: B }>(b => ({
        ...Object(a),
        [k.toString()]: b,
      }));
    });
  }

  /**
   * If a decoder fails, use an alternative decoder.
   */
  public orElse(f: (e: string) => Decoder<A>): Decoder<A> {
    return new Decoder(value => {
      return this.fn(value).orElse(e => f(e).decodeAny(value));
    });
  }

  /**
   * Applies the value from the decoder argument to a function in the current
   * decoder context.
   */
  public ap<B>(decoder: Decoder<B>) {
    return new Decoder(value => {
      const unwrapFn = this.fn(value);
      return unwrapFn.ap(decoder.decodeAny(value));
    });
  }

  /**
   * Run the current decoder on any value
   */
  public decodeAny(value: any) {
    return this.fn(value);
  }

  /**
   * Parse the json string and run the current decoder on the resulting
   * value. Parse errors are returned in an Result.Err, as with any decoder
   * error.
   */
  public decodeJson(json: string) {
    try {
      const value = JSON.parse(json);
      return this.decodeAny(value);
    } catch (e) {
      return err(e.message) as Result<string, A>;
    }
  }

  /**
   * Returns a function that runs this docoder over any value when called.
   * This is a convenient way to convert a decoder into a callback.
   */
  public toAnyFn(): (value: any) => Result<string, A> {
    return (value: any) => this.decodeAny(value);
  }

  /**
   * Returns a function that runs this decoder over a JSON string when called.
   * This is a convenient way to convert a decoder into a callback.
   */
  public toJsonFn(): (json: string) => Result<string, A> {
    return (json: string) => this.decodeJson(json);
  }
}

/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
export const succeed = <A>(value: A) => new Decoder(_ => ok(value));

/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
export const fail = (message: string): Decoder<any> => new Decoder(_ => err(message));

/**
 * String decoder
 */
// tslint:disable-next-line:variable-name
export const string: Decoder<string> = new Decoder<string>(value => {
  if (typeof value !== 'string') {
    const stringified = JSON.stringify(value);
    const errorMsg = `I expected to find a string but instead I found ${stringified}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Number decoder
 */
// tslint:disable-next-line:variable-name
export const number: Decoder<number> = new Decoder<number>(value => {
  if (typeof value !== 'number') {
    const errorMsg = `I expected to find a number but instead I found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Boolean decoder
 */
// tslint:disable-next-line:variable-name
export const boolean: Decoder<boolean> = new Decoder<boolean>(value => {
  if (typeof value !== 'boolean') {
    const errorMsg = `I expected to find a boolean but instead found ${JSON.stringify(value)}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Date decoder.
 *
 * Date decoder expects a value that is a number or a string. It will then try
 * to construct a JavaScript date object from the value.
 */
export const date: Decoder<Date> = new Decoder<Date>(value => {
  const errMsg = (v: any): string => `I expected a date but instead I found ${JSON.stringify(v)}`;
  return ok(value)
    .andThen(s => string.map(v => new Date(v)).decodeAny(s))
    .orElse(n => number.map(v => new Date(v)).decodeAny(n))
    .andThen(d => (isNaN(d.getTime()) ? err<any, Date>(value) : ok(d)))
    .mapError(() => errMsg(value));
});

/**
 * Applies the `decoder` to all of the elements of an array.
 */
export const array = <A>(decoder: Decoder<A>): Decoder<A[]> =>
  new Decoder<A[]>(value => {
    if (!(value instanceof Array)) {
      const errorMsg = `I expected an array but instead I found ${JSON.stringify(value)}`;
      return err(errorMsg) as Result<string, A[]>;
    }

    return value.reduce((memo: Result<string, A[]>, element, idx) => {
      const result = decoder.decodeAny(element);
      return memo.andThen(results => {
        return result
          .mapError(s => `I found an error in the array at [${idx}]: ${s}`)
          .map(v => results.concat([ v ]));
      });
    }, ok([]));
  });

/**
 * Decodes the value at a particular field in a JavaScript object.
 */
export const field = <A>(name: string, decoder: Decoder<A>): Decoder<A> =>
  new Decoder<A>(value => {
    const errorMsg = () => {
      const stringified = JSON.stringify(value);
      const msg = `I expected to find an object with key '${name}' but instead I found ${stringified}`;
      return err<string, A>(msg);
    };
    if (value == null) {
      return errorMsg();
    }
    if (!value.hasOwnProperty(name)) {
      return errorMsg();
    }

    const v = value[name];
    return decoder
      .decodeAny(v)
      .mapError(
        e => `I found an error in the field named '${name}' of ${JSON.stringify(value)}: ${e}`,
      );
  });

/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
export const at = <A>(path: Array<number | string>, decoder: Decoder<A>): Decoder<A> =>
  new Decoder<A>(value => {
    let val = value;
    let idx = 0;
    while (idx < path.length) {
      val = val[path[idx]];
      if (val === undefined) {
        const pathStr = JSON.stringify(path.slice(0, idx + 1));
        const valueStr = JSON.stringify(value);
        return err(
          `I found an error in the 'at' path. I could not find path '${pathStr}' in ${valueStr}`,
        );
      }
      idx += 1;
    }
    return decoder.decodeAny(val);
  });

/**
 * Makes any decoder optional. Be aware that this can mask a failing
 * decoder because it makes any failed decoder result a nothing.
 */
export const maybe = <A>(decoder: Decoder<A>): Decoder<Maybe<A>> =>
  new Decoder(value => {
    return decoder.decodeAny(value).cata({
      Err: e => ok(nothing()),
      Ok: v => ok(just(v)),
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
  new Decoder(value => {
    if (value == null) {
      return ok(nothing());
    }
    return decoder.decodeAny(value).map(just);
  });

/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
export const oneOf = <A>(decoders: Array<Decoder<A>>): Decoder<A> =>
  new Decoder(value => {
    if (decoders.length === 0) {
      return err<string, A>('No decoders specified.');
    }

    const result = decoders.reduce((memo, decoder) => {
      return memo.orElse(err1 => decoder.decodeAny(value).mapError(err2 => `${err1}\n${err2}`));
    }, err<string, A>(''));

    return result.mapError(m => `I found the following problems:\n${m}`);
  });

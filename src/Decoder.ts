import { isValid, parseISO, parseJSON } from 'date-fns';
import { just, Maybe, nothing } from 'maybeasy';
import { err, Err, ok, Result } from 'resulty';
import { stringify } from './Internal/ErrorStringify';

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
  public decodeJson = (json: string) => {
    try {
      const value = JSON.parse(json);
      return this.decodeAny(value);
    } catch (e) {
      return err(e.message) as Result<string, A>;
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

/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
export const succeed = <A>(value: A) => new Decoder((_) => ok(value));

/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
export const fail = <A>(message: string): Decoder<A> =>
  new Decoder((_) => err(message));

/**
 * String decoder
 */
// tslint:disable-next-line:variable-name
export const string: Decoder<string> = new Decoder<string>((value) => {
  if (typeof value !== 'string') {
    const stringified = stringify(value);
    const errorMsg = `I expected to find a string but instead I found ${stringified}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Number decoder
 */
// tslint:disable-next-line:variable-name
export const number: Decoder<number> = new Decoder<number>((value) => {
  if (typeof value !== 'number') {
    const errorMsg = `I expected to find a number but instead I found ${stringify(
      value
    )}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Boolean decoder
 */
// tslint:disable-next-line:variable-name
export const boolean: Decoder<boolean> = new Decoder<boolean>((value) => {
  if (typeof value !== 'boolean') {
    const errorMsg = `I expected to find a boolean but instead found ${stringify(
      value
    )}`;
    return err(errorMsg);
  }

  return ok(value);
});

/**
 * Date decoder.
 *
 * Date decoder expects a value that is a number or a string. It will then try
 * to construct a JavaScript date object from the value.
 *
 * This decoder use the Date constructor, and so assumes the same cross browser
 * inconsistencies.
 */
export const date: Decoder<Date> = new Decoder<Date>((value) => {
  const errMsg = (v: any): string =>
    `I expected a date but instead I found ${stringify(v)}`;
  return ok(value)
    .andThen((s) => string.map((v) => new Date(v)).decodeAny(s))
    .orElse((n) => number.map((v) => new Date(v)).decodeAny(n))
    .andThen((d) => (isNaN(d.getTime()) ? err<any, Date>(value) : ok(d)))
    .mapError(() => errMsg(value));
});

/**
 * Date ISO decoder
 *
 * The Date ISO decoder expects a value that is a string formatted in some
 * variation of ISO 8601. It will fail if the date is invalid or is not a
 * recognized ISO 8601 format.
 *
 * Relies on parseISO from date-fns
 * https://date-fns.org/v2.16.1/docs/parseISO
 */
export const dateISO: Decoder<Date> = new Decoder<Date>((value) => {
  return ok<string, unknown>(value)
    .andThen((v) => string.decodeAny(v))
    .map(parseISO)
    .andThen((d) =>
      isValid(d)
        ? ok(d)
        : err(`I expected an ISO date but instead I found ${stringify(value)}`)
    );
});

/**
 * Date JSON decoder
 *
 * This decoder parses date formats common in JSON APIs
 *
 * See parseJSON from date-fns for more information on supported formats
 * https://date-fns.org/v2.16.1/docs/parseJSON
 *
 */
export const dateJSON: Decoder<Date> = new Decoder<Date>((value) => {
  return ok<string, unknown>(value)
    .andThen((v) => string.decodeAny(v))
    .map(parseJSON)
    .andThen((d) =>
      isValid(d)
        ? ok(d)
        : err(`I expected an JSON date but instead I found ${stringify(value)}`)
    );
});

/**
 * Applies the `decoder` to all of the elements of an array.
 */
export const array = <A>(decoder: Decoder<A>): Decoder<A[]> =>
  new Decoder<A[]>((value) => {
    if (!(value instanceof Array)) {
      const errorMsg = `I expected an array but instead I found ${stringify(
        value
      )}`;
      return err(errorMsg);
    }

    let result: Result<string, A[]> = ok([]);

    for (let idx = 0; idx < value.length; idx++) {
      result = decoder
        .decodeAny(value[idx])
        .andThen((v) => result.map((vs) => vs.concat([v])))
        .mapError((e) => `${e}:\nerror found in an array at [${idx}]`);
      if (result instanceof Err) {
        break;
      }
    }

    return result;
  });

/**
 * Decodes the value at a particular field in a JavaScript object.
 */
export const field = <A>(name: string, decoder: Decoder<A>): Decoder<A> =>
  new Decoder<A>((value) => {
    const errorMsg = () => {
      const stringified = stringify(value);
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
      .mapError((e) => `${e}:\noccurred in a field named '${name}'`);
  });

/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
export const at = <A>(
  path: Array<number | string>,
  decoder: Decoder<A>
): Decoder<A> =>
  new Decoder<A>((value) => {
    if (value == null) {
      return err(
        `I found an error. Could not apply 'at' path to an undefined or null value.`
      );
    }
    let val = value;
    let idx = 0;
    while (idx < path.length) {
      val = val[path[idx]];
      if (val === undefined) {
        const pathStr = stringify(path.slice(0, idx + 1));
        const valueStr = stringify(value);
        return err(
          `I found an error in the 'at' path. I could not find path '${pathStr}' in ${valueStr}`
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

/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
export const oneOf = <A>(decoders: Array<Decoder<A>>): Decoder<A> =>
  new Decoder((value) => {
    if (decoders.length === 0) {
      return err<string, A>('No decoders specified.');
    }

    const result = decoders.reduce((memo, decoder) => {
      return memo.orElse((err1) =>
        decoder.decodeAny(value).mapError((err2) => `${err1}\n${err2}`)
      );
    }, err<string, A>(''));

    return result.mapError((m) => `I found the following problems:\n${m}`);
  });

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
        `Expected to find an object and instead found '${stringify(value)}'`
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

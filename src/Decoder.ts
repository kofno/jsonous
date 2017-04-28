import { just, Maybe, nothing } from 'maybeasy';
import { err, ok, Result } from 'resulty';

/**
 * A decoder function takes an object of any type and returns a Result
 */
export type DecoderFn<A> = (thing: any) => Result<string, A>;

/**
 * A Decoder represents a value that can be converted to a known type, either
 * from JSON or from an <any> typed object.
 */
class Decoder<A> {
  private fn: DecoderFn<A>;

  constructor(thisFn: DecoderFn<A>) {
    this.fn = thisFn;
  }

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
}

/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
function succeed<A>(value: A) {
  return new Decoder(_ => ok(value));
}

/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
function fail(message: string): Decoder<any> {
  return new Decoder(_ => err(message));
}

/**
 * String decoder
 */
function string(): Decoder<string> {
  return new Decoder<string>(value => {
    if (typeof value !== 'string') {
      return err(`${value} is not a string`);
    }

    return ok(value);
  });
}

/**
 * Number decoder
 */
function number(): Decoder<number> {
  return new Decoder<number>(value => {
    if (typeof value !== 'number') {
      return err(`${value} is not a number`);
    }

    return ok(value);
  });
}

/**
 * Boolean decoder
 */
function boolean(): Decoder<boolean> {
  return new Decoder<boolean>(value => {
    if (typeof value !== 'boolean') {
      return err(`'${value}' is not a boolean`);
    }

    return ok(value);
  });
}

/**
 * Applies the `decoder` to all of the elements of an array.
 */
function array<A>(decoder: Decoder<A>): Decoder<A[]> {
  return new Decoder<A[]>(value => {
    if (!(value instanceof Array)) {
      return err(`'${value}' is not an array`) as Result<string, A[]>;
    }

    return value.reduce((memo: Result<string, A[]>, element) => {
      const result = decoder.decodeAny(element);
      return memo.andThen(results => {
        return result.map(v => results.concat([v]));
      });
    }, ok([]));
  });
}

/**
 * Decodes the value at a particular field in a JavaScript object.
 */
function field<A>(name: string, decoder: Decoder<A>): Decoder<A> {
  return new Decoder<A>(value => {
    if (!(value.hasOwnProperty(name))) {
      return err(`Expected to find key '${name}'`);
    }

    const v = value[name];
    return decoder.decodeAny(v);
  });
}

/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
function at<A>(path: Array<number | string>, decoder: Decoder<A>): Decoder<A> {
  return new Decoder<A>(value => {
    let val = value;
    let idx = 0;
    while (idx < path.length) {
      val = val[path[idx]];
      if (val == null) {
        return err(`Path failure: Expected to find key '${path.slice(0, idx + 1)}'`);
      }
      idx += 1;
    }
    return decoder.decodeAny(val);
  });
}

/**
 * Makes any decoder optional.
 */
function maybe<A>(decoder: Decoder<A>): Decoder<Maybe<A>> {
  return new Decoder(value => {
    return decoder.decodeAny(value).cata({
      Err: e => ok(nothing()),
      Ok: v => ok(just(v)),
    });
  });
}

/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
function oneOf<A>(decoders: Array<Decoder<A>>): Decoder<A> {
  return new Decoder(value => {
    const result = decoders.reduce((memo, decoder) => {
      return memo.orElse(_ => decoder.decodeAny(value));
    }, err('No decoders specified') as Result<string, A>);

    return result.mapError(m => `Unexpected data. Last failure: ${m}`);
  });
}

export default Decoder;
export {
  string,
  number,
  boolean,
  array,
  field,
  succeed,
  at,
  maybe,
  oneOf,
  fail,
};

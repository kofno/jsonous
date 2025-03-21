import { err, ok, Result } from 'resulty';
import Decoder from './Decoder';
import { safeStringify } from './utils';

/**
 * Applies the `decoder` to all of the elements of an array.
 */
export const array = <A>(decoder: Decoder<A>): Decoder<A[]> =>
  new Decoder<A[]>((value) => {
    if (!(value instanceof Array)) {
      const errorMsg = `I expected an array but instead I found ${safeStringify(value)}`;
      return err(errorMsg);
    }

    let result: Result<string, A[]> = ok([]);

    for (let idx = 0; idx < value.length; idx++) {
      result = decoder
        .decodeAny(value[idx])
        .andThen((v) => result.map((vs) => vs.concat([v])))
        .mapError((e) => `${e}:\nerror found in an array at [${idx}]`);
      if (result.isErr()) {
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
      const stringified = safeStringify(value);
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
    return decoder.decodeAny(v).mapError((e) => `${e}:\noccurred in a field named '${name}'`);
  });

/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
export const at = <A>(path: Array<number | string>, decoder: Decoder<A>): Decoder<A> =>
  new Decoder<A>((value) => {
    if (value == null) {
      return err(`I found an error. Could not apply 'at' path to an undefined or null value.`);
    }
    let val = value;
    let idx = 0;
    while (idx < path.length) {
      val = val[path[idx]];
      if (val === undefined) {
        const pathStr = safeStringify(path.slice(0, idx + 1));
        const valueStr = safeStringify(value);
        return err(
          `I found an error in the 'at' path. I could not find path '${pathStr}' in ${valueStr}`
        );
      }
      idx += 1;
    }
    return decoder.decodeAny(val);
  });

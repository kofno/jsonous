import { isValid, parseISO, parseJSON } from 'date-fns';
import { err, ok } from 'resulty';
import { number, string } from './base';
import Decoder from './Decoder';
import { safeStringify } from './utils';

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
  const errMsg = (v: any): string => `I expected a date but instead I found ${safeStringify(v)}`;
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
      isValid(d) ? ok(d) : err(`I expected an ISO date but instead I found ${safeStringify(value)}`)
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
        : err(`I expected an JSON date but instead I found ${safeStringify(value)}`)
    );
});

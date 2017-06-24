import { Maybe } from 'maybeasy';
import { Result } from 'resulty';
/**
 * A decoder function takes an object of any type and returns a Result
 */
export declare type DecoderFn<A> = (thing: any) => Result<string, A>;
/**
 * A Decoder represents a value that can be converted to a known type, either
 * from JSON or from an <any> typed object.
 */
export default class Decoder<A> {
    private fn;
    constructor(thisFn: DecoderFn<A>);
    /**
     * Lifts any function up to operate on the value in the Decoder context.
     */
    map<B>(f: (a: A) => B): Decoder<B>;
    /**
     * Chains decoders together. Can be used when the value from a decoder is
     * needed to decode the rest of the data. For example, if you have a versioned
     * api, you can check the version number and then select an appropriate decoder
     * for the rest of the data.
     *
     * Also, chaining decoders is one way to build new types from decoded objects.
     */
    andThen<B>(f: (a: A) => Decoder<B>): Decoder<B>;
    /**
     * If a decoder fails, use an alternative decoder.
     */
    orElse(f: (e: string) => Decoder<A>): Decoder<A>;
    /**
     * Applies the value from the decoder argument to a function in the current
     * decoder context.
     */
    ap<B>(decoder: Decoder<B>): Decoder<{}>;
    /**
     * Run the current decoder on any value
     */
    decodeAny(value: any): Result<string, A>;
    /**
     * Parse the json string and run the current decoder on the resulting
     * value. Parse errors are returned in an Result.Err, as with any decoder
     * error.
     */
    decodeJson(json: string): Result<string, A>;
    /**
     * Returns a function that runs this docoder over any value when called.
     * This is a convenient way to convert a decoder into a callback.
     */
    toAnyFn(): (value: any) => Result<string, A>;
    /**
     * Returns a function that runs this decoder over a JSON string when called.
     * This is a convenient way to convert a decoder into a callback.
     */
    toJsonFn(): (json: string) => Result<string, A>;
}
/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
export declare const succeed: <A>(value: A) => Decoder<A>;
/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
export declare const fail: (message: string) => Decoder<any>;
/**
 * String decoder
 */
export declare const string: () => Decoder<string>;
/**
 * Number decoder
 */
export declare const number: () => Decoder<number>;
/**
 * Boolean decoder
 */
export declare const boolean: () => Decoder<boolean>;
/**
 * Applies the `decoder` to all of the elements of an array.
 */
export declare const array: <A>(decoder: Decoder<A>) => Decoder<A[]>;
/**
 * Decodes the value at a particular field in a JavaScript object.
 */
export declare const field: <A>(name: string, decoder: Decoder<A>) => Decoder<A>;
/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
export declare const at: <A>(path: (string | number)[], decoder: Decoder<A>) => Decoder<A>;
/**
 * Makes any decoder optional.
 */
export declare const maybe: <A>(decoder: Decoder<A>) => Decoder<Maybe<A>>;
/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
export declare const oneOf: <A>(decoders: Decoder<A>[]) => Decoder<A>;

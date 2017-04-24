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
declare class Decoder<A> {
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
}
/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
declare function succeed<A>(value: A): Decoder<A>;
/**
 * String decoder
 */
declare function string(): Decoder<string>;
/**
 * Number decoder
 */
declare function number(): Decoder<number>;
/**
 * Boolean decoder
 */
declare function boolean(): Decoder<boolean>;
/**
 * Applies the `decoder` to all of the elements of an array.
 */
declare function array<A>(decoder: Decoder<A>): Decoder<A[]>;
/**
 * Decodes the value at a particular field in a JavaScript object.
 */
declare function field<A>(name: string, decoder: Decoder<A>): Decoder<A>;
/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
declare function at<A>(path: Array<number | string>, decoder: Decoder<A>): Decoder<A>;
/**
 * Makes any decoder optional.
 */
declare function maybe<A>(decoder: Decoder<A>): Decoder<Maybe<A>>;
/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
declare function oneOf<A>(decoders: Array<Decoder<A>>): Decoder<A>;
export default Decoder;
export { string, number, boolean, array, field, succeed, at, maybe, oneOf };

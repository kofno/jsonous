"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var maybeasy_1 = require("maybeasy");
var resulty_1 = require("resulty");
/**
 * A Decoder represents a value that can be converted to a known type, either
 * from JSON or from an <any> typed object.
 */
var Decoder = (function () {
    function Decoder(thisFn) {
        this.fn = thisFn;
    }
    /**
     * Lifts any function up to operate on the value in the Decoder context.
     */
    Decoder.prototype.map = function (f) {
        var _this = this;
        return new Decoder(function (value) {
            return _this.fn(value).map(f);
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
    Decoder.prototype.andThen = function (f) {
        var _this = this;
        return new Decoder(function (value) {
            return _this.fn(value).andThen(function (v) { return f(v).decodeAny(value); });
        });
    };
    /**
     * If a decoder fails, use an alternative decoder.
     */
    Decoder.prototype.orElse = function (f) {
        var _this = this;
        return new Decoder(function (value) {
            return _this.fn(value).orElse(function (e) { return f(e).decodeAny(value); });
        });
    };
    /**
     * Applies the value from the decoder argument to a function in the current
     * decoder context.
     */
    Decoder.prototype.ap = function (decoder) {
        var _this = this;
        return new Decoder(function (value) {
            var unwrapFn = _this.fn(value);
            return unwrapFn.ap(decoder.decodeAny(value));
        });
    };
    /**
     * Run the current decoder on any value
     */
    Decoder.prototype.decodeAny = function (value) {
        return this.fn(value);
    };
    /**
     * Parse the json string and run the current decoder on the resulting
     * value. Parse errors are returned in an Result.Err, as with any decoder
     * error.
     */
    Decoder.prototype.decodeJson = function (json) {
        try {
            var value = JSON.parse(json);
            return this.decodeAny(value);
        }
        catch (e) {
            return resulty_1.err(e.message);
        }
    };
    return Decoder;
}());
/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
function succeed(value) {
    return new Decoder(function (_) { return resulty_1.ok(value); });
}
exports.succeed = succeed;
/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
function fail(message) {
    return new Decoder(function (_) { return resulty_1.err(message); });
}
/**
 * String decoder
 */
function string() {
    return new Decoder(function (value) {
        if (typeof value !== 'string') {
            return resulty_1.err(value + " is not a string");
        }
        return resulty_1.ok(value);
    });
}
exports.string = string;
/**
 * Number decoder
 */
function number() {
    return new Decoder(function (value) {
        if (typeof value !== 'number') {
            return resulty_1.err(value + " is not a number");
        }
        return resulty_1.ok(value);
    });
}
exports.number = number;
/**
 * Boolean decoder
 */
function boolean() {
    return new Decoder(function (value) {
        if (typeof value !== 'boolean') {
            return resulty_1.err("'" + value + "' is not a boolean");
        }
        return resulty_1.ok(value);
    });
}
exports.boolean = boolean;
/**
 * Applies the `decoder` to all of the elements of an array.
 */
function array(decoder) {
    return new Decoder(function (value) {
        if (!(value instanceof Array)) {
            return resulty_1.err("'" + value + "' is not an array");
        }
        return value.reduce(function (memo, element) {
            var result = decoder.decodeAny(element);
            return memo.andThen(function (results) {
                return result.map(function (v) { return results.concat([v]); });
            });
        }, resulty_1.ok([]));
    });
}
exports.array = array;
/**
 * Decodes the value at a particular field in a JavaScript object.
 */
function field(name, decoder) {
    return new Decoder(function (value) {
        if (!(value.hasOwnProperty(name))) {
            return resulty_1.err("Expected to find key '" + name + "'");
        }
        var v = value[name];
        return decoder.decodeAny(v);
    });
}
exports.field = field;
/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
function at(path, decoder) {
    return new Decoder(function (value) {
        var val = value;
        var idx = 0;
        while (idx < path.length) {
            val = val[path[idx]];
            if (val == null) {
                return resulty_1.err("Path failure: Expected to find key '" + path.slice(0, idx + 1) + "'");
            }
            idx += 1;
        }
        return decoder.decodeAny(val);
    });
}
exports.at = at;
/**
 * Makes any decoder optional.
 */
function maybe(decoder) {
    return new Decoder(function (value) {
        return decoder.decodeAny(value).cata({
            Err: function (e) { return resulty_1.ok(maybeasy_1.nothing()); },
            Ok: function (v) { return resulty_1.ok(maybeasy_1.just(v)); },
        });
    });
}
exports.maybe = maybe;
/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
function oneOf(decoders) {
    return new Decoder(function (value) {
        var result = decoders.reduce(function (memo, decoder) {
            return memo.orElse(function (_) { return decoder.decodeAny(value); });
        }, resulty_1.err('No decoders specified'));
        return result.mapError(function (m) { return "Unexpected data. Last failure: " + m; });
    });
}
exports.oneOf = oneOf;
exports.default = Decoder;
//# sourceMappingURL=Decoder.js.map
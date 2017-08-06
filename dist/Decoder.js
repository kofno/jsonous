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
    /**
     * Returns a function that runs this docoder over any value when called.
     * This is a convenient way to convert a decoder into a callback.
     */
    Decoder.prototype.toAnyFn = function () {
        var _this = this;
        return function (value) { return _this.decodeAny(value); };
    };
    /**
     * Returns a function that runs this decoder over a JSON string when called.
     * This is a convenient way to convert a decoder into a callback.
     */
    Decoder.prototype.toJsonFn = function () {
        var _this = this;
        return function (json) { return _this.decodeJson(json); };
    };
    return Decoder;
}());
exports.default = Decoder;
/**
 * Returns a decoder that always succeeds, resolving to the value passed in.
 */
exports.succeed = function (value) { return new Decoder(function (_) { return resulty_1.ok(value); }); };
/**
 * Returns a decoder that always fails, returning an Err with the message
 * passed in.
 */
exports.fail = function (message) {
    return new Decoder(function (_) { return resulty_1.err(message); });
};
/**
 * String decoder
 */
// tslint:disable-next-line:variable-name
exports.string = new Decoder(function (value) {
    if (typeof value !== 'string') {
        var stringified = JSON.stringify(value);
        var errorMsg = "Expected to find a string. Instead found " + stringified;
        return resulty_1.err(errorMsg);
    }
    return resulty_1.ok(value);
});
/**
 * Number decoder
 */
// tslint:disable-next-line:variable-name
exports.number = new Decoder(function (value) {
    if (typeof value !== 'number') {
        var errorMsg = "Expected to find a number. Instead found " + JSON.stringify(value);
        return resulty_1.err(errorMsg);
    }
    return resulty_1.ok(value);
});
/**
 * Boolean decoder
 */
// tslint:disable-next-line:variable-name
exports.boolean = new Decoder(function (value) {
    if (typeof value !== 'boolean') {
        var errorMsg = "Expected to find a boolean. Instead found " + JSON.stringify(value);
        return resulty_1.err(errorMsg);
    }
    return resulty_1.ok(value);
});
/**
 * Date decoder.
 */
exports.date = new Decoder(function (value) {
    var d = new Date(value);
    var errMsg = function (v) {
        return "Expected a date. Instead found " + JSON.stringify(v) + ".";
    };
    return isNaN(d.getTime()) ? resulty_1.err(errMsg(value)) : resulty_1.ok(d);
});
/**
 * Applies the `decoder` to all of the elements of an array.
 */
exports.array = function (decoder) {
    return new Decoder(function (value) {
        if (!(value instanceof Array)) {
            var errorMsg = "Expected an array. Instead found " + JSON.stringify(value);
            return resulty_1.err(errorMsg);
        }
        return value.reduce(function (memo, element, idx) {
            var result = decoder.decodeAny(element);
            return memo.andThen(function (results) {
                return result
                    .mapError(function (s) { return "Error found in array at [" + idx + "]: " + s; })
                    .map(function (v) { return results.concat([v]); });
            });
        }, resulty_1.ok([]));
    });
};
/**
 * Decodes the value at a particular field in a JavaScript object.
 */
exports.field = function (name, decoder) {
    return new Decoder(function (value) {
        if (!value.hasOwnProperty(name)) {
            var stringified = JSON.stringify(value);
            var errorMsg = "Expected to find an object with key '" + name + "'. Instead found " + stringified;
            return resulty_1.err(errorMsg);
        }
        var v = value[name];
        return decoder
            .decodeAny(v)
            .mapError(function (err) {
            return "Error found in field '" + name + "' of " + JSON.stringify(value) + ": " + err;
        });
    });
};
/**
 * Decodes the value at a particular path in a nested JavaScript object.
 */
exports.at = function (path, decoder) {
    return new Decoder(function (value) {
        var val = value;
        var idx = 0;
        while (idx < path.length) {
            val = val[path[idx]];
            if (val == null) {
                var pathStr = JSON.stringify(path.slice(0, idx + 1));
                var valueStr = JSON.stringify(value);
                return resulty_1.err("Path failure: Expected to find path '" + pathStr + "' in " + valueStr);
            }
            idx += 1;
        }
        return decoder.decodeAny(val);
    });
};
/**
 * Makes any decoder optional.
 */
exports.maybe = function (decoder) {
    return new Decoder(function (value) {
        return decoder.decodeAny(value).cata({
            Err: function (e) { return resulty_1.ok(maybeasy_1.nothing()); },
            Ok: function (v) { return resulty_1.ok(maybeasy_1.just(v)); },
        });
    });
};
/**
 * Applies a series of decoders, in order, until one succeeds or they all
 * fail.
 */
exports.oneOf = function (decoders) {
    return new Decoder(function (value) {
        var result = decoders.reduce(function (memo, decoder) {
            return memo.orElse(function (_) { return decoder.decodeAny(value); });
        }, resulty_1.err('No decoders specified'));
        return result.mapError(function (m) { return "Unexpected data. Last failure: " + m; });
    });
};
//# sourceMappingURL=Decoder.js.map
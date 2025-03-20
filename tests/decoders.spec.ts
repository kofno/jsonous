import { describe, expect, it, mock } from 'bun:test';
import { err, ok, Result } from 'resulty';
import Decoder from '../src/Decoder';

// Helper function to check for errors
function expectError<T>(result: Result<string, T>, expectedError: string) {
  result.cata({
    Err: (e) => expect(e).toBe(expectedError),
    Ok: () => expect(true).toBe(false),
  });
}

// Helper function to check for success
function expectSuccess<T>(result: Result<string, T>, expectedValue: T) {
  result.cata({
    Err: (msg) => {
      console.error('Expected success but got error:', msg);
      expect(true).toBe(false);
    },
    Ok: (v) => expect(v).toEqual(expectedValue),
  });
}

describe('Decoder', () => {
  describe('map', () => {
    it('should map over a successful result', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).map((s) => s.length);
      expectSuccess(decoder.decodeAny('hello'), 5);
    });

    it('should not map over a failed result', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).map((s) => s.length);
      expectError(decoder.decodeAny(123), 'Not a string');
    });
  });

  describe('andThen', () => {
    it('should chain decoders together', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).andThen((s) => {
        return new Decoder<number>((value) => {
          if (typeof value === 'number' && !isNaN(value)) {
            return ok(value);
          }
          const v = parseInt(s, 10);
          if (isNaN(v)) {
            return err('Not a number');
          }
          return ok(v);
        }).map((n) => ({ str: s, num: n }));
      });
      expectSuccess(decoder.decodeAny('5'), { str: '5', num: 5 });
      expectError(decoder.decodeAny('hello'), 'Not a number');
      expectError(decoder.decodeAny(true), 'Not a string');
    });
  });

  describe('assign', () => {
    it('should assign values to an object', () => {
      const decoder = new Decoder<{}>((value) => {
        return ok({});
      })
        .assign('s', (s) => new Decoder((_) => ok('hello')))
        .assign('strCount', ({ s }) => new Decoder((_) => ok(s.length)));
      expectSuccess(decoder.decodeAny('hello'), { strCount: 5, s: 'hello' });
    });

    it('should assign values to an object with multiple fields', () => {
      const decoder = new Decoder<{}>((value) => {
        return ok({});
      })
        .assign('str', (s) => new Decoder((_) => ok('hello')))
        .assign('length', ({ str }) => new Decoder((_) => ok(str.length)))
        .assign('firstChar', ({ str }) => new Decoder((_) => ok(str[0])));
      expectSuccess(decoder.decodeAny('hello'), {
        length: 5,
        firstChar: 'h',
        str: 'hello',
      });
    });

    it('should handle decoder failures', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      })
        .assign('length', (s) => new Decoder((_) => ok(s.length)))
        .assign('firstChar', (s) => new Decoder((_) => err('oops')));
      expectError(decoder.decodeAny('hello'), 'oops');
    });

    it('should handle decoder failures in the first decoder', () => {
      const decoder = new Decoder<string>((_) => err('oops'))
        .assign('length', (s) => new Decoder((_) => ok(s.length)))
        .assign('firstChar', (s) => new Decoder((_) => ok(s[0])));
      expectError(decoder.decodeAny('hello'), 'oops');
    });

    it('should handle decoder failures in the second decoder', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      })
        .assign('length', (_) => new Decoder((_) => err('oops')))
        .assign('firstChar', (s) => new Decoder((_) => ok(s[0])));
      expectError(decoder.decodeAny('hello'), 'oops');
    });
  });

  describe('do', () => {
    it('should perform a side effect', () => {
      const mockFn = mock();
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).do(mockFn);
      decoder.decodeAny('hello');
      expect(mockFn).toHaveBeenCalledWith('hello');
    });
  });

  describe('mapError', () => {
    it('should map over a failed result', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).mapError((e) => `Error: ${e}`);
      expectError(decoder.decodeAny(123), 'Error: Not a string');
    });

    it('should not map over a successful result', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).mapError((e) => `Error: ${e}`);
      expectSuccess(decoder.decodeAny('hello'), 'hello');
    });
  });

  describe('orElse', () => {
    it('should use an alternative decoder if the first fails', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).orElse(() => new Decoder((_) => ok('fallback')));
      expectSuccess(decoder.decodeAny(123), 'fallback');
      expectSuccess(decoder.decodeAny('hello'), 'hello');
    });
  });

  describe('elseDo', () => {
    it('should perform a side effect on failure', () => {
      const mockFn = mock();
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).elseDo(mockFn);
      decoder.decodeAny(123);
      expect(mockFn).toHaveBeenCalledWith('Not a string');
    });

    it('should not perform a side effect on success', () => {
      const mockFn = mock();
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      }).elseDo(mockFn);
      decoder.decodeAny('hello');
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  describe('decodeAny', () => {
    it('should decode any value', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      });
      expectSuccess(decoder.decodeAny('hello'), 'hello');
      expectError(decoder.decodeAny(123), 'Not a string');
    });
  });

  describe('decodeJson', () => {
    it('should decode a JSON string', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      });
      expectSuccess(decoder.decodeJson('"hello"'), 'hello');
    });

    it('should handle JSON parse errors', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      });
      expectError(
        decoder.decodeJson('invalid'),
        'JSON Parse error: Unexpected identifier "invalid"'
      );
    });
  });

  describe('toAnyFn', () => {
    it('should return a function that decodes any value', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      });
      const fn = decoder.toAnyFn();
      expectSuccess(fn('hello'), 'hello');
      expectError(fn(123), 'Not a string');
    });
  });

  describe('toJsonFn', () => {
    it('should return a function that decodes a JSON string', () => {
      const decoder = new Decoder<string>((value) => {
        if (typeof value === 'string') {
          return ok(value);
        }
        return err('Not a string');
      });
      const fn = decoder.toJsonFn();
      expectSuccess(fn('"hello"'), 'hello');
      expectError(fn('invalid'), 'JSON Parse error: Unexpected identifier "invalid"');
    });
  });
});

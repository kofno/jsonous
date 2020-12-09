import * as test from 'tape';
import {
  array,
  at,
  boolean,
  date,
  dateISO,
  dateJSON,
  dict,
  field,
  keyValuePairs,
  maybe,
  nullable,
  number,
  oneOf,
  string,
  succeed,
} from '../src/index';

test('string decoder', (t) => {
  string.decodeJson('"foo"').cata({
    Err: (m) => t.fail(`string decoder should have succeeded: ${m}`),
    Ok: (v) => t.pass(`string decoder worked on ${v}`),
  });

  string.decodeJson('8').cata({
    Err: (m) => t.pass(`string decoder failed with: ${m}`),
    Ok: (v) => t.fail(`string decoder should have failed on ${v}`),
  });

  t.end();
});

test('number decoder', (t) => {
  number.decodeJson('42').cata({
    Err: (m) => t.fail(`number decoder should have succeeded: ${m}`),
    Ok: (v) => t.pass(`number decoder worked on ${v}`),
  });

  number.decodeJson('"foo"').cata({
    Err: (m) => t.pass(`number decoder failed with: ${m}`),
    Ok: (v) => t.fail(`number decoder should have failed on ${v}`),
  });

  t.end();
});

test('boolean decoder', (t) => {
  boolean.decodeJson('true').cata({
    Err: (m) => t.fail(`boolean decoder should have passed: ${m}`),
    Ok: (v) => t.pass(`boolean decoder worked on ${v}`),
  });

  boolean.decodeJson('"foo"').cata({
    Err: (m) => t.pass(`boolean decoder failed: ${m}`),
    Ok: (v) => t.fail(`boolean decoder should have failed on ${v}`),
  });

  t.end();
});

test('date decoder', (t) => {
  date.decodeJson('"12/1/2016"').cata({
    Err: (m) => t.fail(`date decoder should have passed: ${m}`),
    Ok: (v) => t.pass(`date decoder worked on ${v}`),
  });

  date.decodeJson('"foo"').cata({
    Err: (m) => t.pass(`date decoder failed: ${m}`),
    Ok: (v) => t.fail(`Expected date decoder to fail: ${v}`),
  });

  date.decodeJson('null').cata({
    Err: (m) => t.pass(`date decoder failed: ${m}`),
    Ok: (v) => t.fail(`Expected date decoder to fail: ${v}`),
  });

  t.end();
});

test('dateISO decoder', (t) => {
  dateISO.decodeAny('2020-12-25').cata({
    Err: (m) => t.fail(`date iso decoder should have passed: ${m}`),
    Ok: (v) => t.pass(`date iso decoder worked on ${v}`),
  });

  dateISO.decodeAny('2020-12-32').cata({
    Err: (m) => t.pass(`date iso decoder failed as expected: ${m}`),
    Ok: (v) => t.fail(`date iso decoder should have failed: ${v}`),
  });

  t.end();
});

test('dateJSON decoder', (t) => {
  dateJSON.decodeAny('2020-12-25T05:20:10.123Z').cata({
    Err: (m) => t.fail(`date iso decoder should have passed: ${m}`),
    Ok: (v) => t.pass(`date iso decoder worked on ${v}`),
  });

  dateJSON.decodeAny('2020-12-25').cata({
    Err: (m) => t.pass(`date iso decoder failed as expected: ${m}`),
    Ok: (v) => t.fail(`date iso decoder should have failed: ${v}`),
  });

  t.end();
});

test('array decoder', (t) => {
  array(string)
    .decodeJson('["foo", "bar", "baz"]')
    .cata({
      Err: (m) => t.fail(`array decoder should have passed: ${m}`),
      Ok: (v) => t.pass(`array decoder passed: ${v}`),
    });

  array(string)
    .decodeJson('["foo", 42, "bar"]')
    .cata({
      Err: (m) => t.pass(`array decoder failed: ${m}`),
      Ok: (v) => t.fail(`array decoder should have failed: ${v}`),
    });

  t.end();
});

test('field decoder', (t) => {
  field('foo', string)
    .decodeJson('{ "foo": "bar" }')
    .cata({
      Err: (m) => t.fail(`field decoder should have passed: ${m}`),
      Ok: (v) => t.pass(`field decoder worked. Returned: ${v}`),
    });

  field('foo', string)
    .decodeJson('{ "bar": "baz" }')
    .cata({
      Err: (m) => t.pass(`field decoder failed: ${m}`),
      Ok: (v) => t.fail(`field decoder should have failed: ${v}`),
    });

  field('foo', string)
    .decodeJson('{ "foo": 42 }')
    .cata({
      Err: (m) => t.pass(`field decoder failed: ${m}`),
      Ok: (v) => t.fail(`field decoder should have failed: ${v}`),
    });

  field('foo', string)
    .decodeAny(null)
    .cata({
      Err: (m) => t.pass(`field decoder failed: ${m}`),
      Ok: (v) => t.fail(`field decoder should have failed: ${v}`),
    });

  t.end();
});

test('nesting field decoders', (t) => {
  const decoder = field('foo', field('bar', field('baz', string)));
  decoder
    .decodeAny({
      foo: { bar: { baz: 42 } },
    })
    .cata({
      Err: (m) => {
        console.log(m);
        t.pass(`Expected: ${m}`);
      },
      Ok: (v) => t.fail(`Unexpected: ${v}`),
    });

  t.end();
});

test('at decoder', (t) => {
  at(['foo', 0, 'bar'], number)
    .decodeAny({ foo: [{ bar: 42 }] })
    .cata({
      Err: (m) => t.fail(`Expected path to pass: ${m}`),
      Ok: (v) => t.pass(`at decoder worked. Returned: ${v}`),
    });

  at(['foo', 1, 'bar'], number)
    .decodeAny({ foo: [{ bar: 42 }] })
    .cata({
      Err: (m) => t.pass(`at failed with: ${m}`),
      Ok: (v) => t.fail(`at should have failed: ${v}`),
    });

  at(['foo', 0, 'bar'], nullable(number))
    .decodeAny({ foo: [{ bar: null }] })
    .cata({
      Err: (m) => t.fail('at should be compatible with nullable'),
      Ok: (v) => t.pass(`at is compatible with nullable`),
    });

  at(['foo', 0, 'bar'], number)
    .decodeAny(undefined)
    .cata({
      Err: () =>
        t.pass(`at-ing an undefined to should be an error, but not crash`),
      Ok: () => t.fail(`at-ing an undefined should not pass`),
    });

  t.end();
});

test('decoder mapping', (t) => {
  string
    .map((s) => s.toUpperCase())
    .decodeJson('"foo"')
    .cata({
      Err: (m) => t.fail(`mapping a decoder should pass: ${m}`),
      Ok: (v) => t.pass(`mapping a decoder passed: ${v}`),
    });

  string
    .map((s) => s.toUpperCase())
    .decodeJson('42')
    .cata({
      Err: (m) => t.pass(`mapping failed decoders returns errors: ${m}`),
      Ok: (v) => t.pass(`mapping failed decoders should fail: ${v}`),
    });

  t.end();
});

test('decoder binding', (t) => {
  field('foo', string)
    .andThen((a) => succeed({ baz: a }))
    .decodeJson('{"foo":"bar"}')
    .cata({
      Err: (m) => t.fail(`andThen should have passed: ${m}`),
      Ok: (v) => t.pass(`andThen passed with value: ${JSON.stringify(v)}`),
    });

  t.end();
});

test('Decoder.do', (t) => {
  string
    .do((v) => t.pass(`Should run side-effect: ${v}`))
    .decodeAny('foo')
    .cata({
      Err: (m) => t.fail(`should succeed: ${m}`),
      Ok: (v) => t.equal('foo', v),
    });

  string
    .do((v) => t.fail(`Should not run side-effect: ${v}`))
    .decodeAny(42)
    .cata({
      Err: (m) => t.pass(`should have failed: ${m}`),
      Ok: (v) => t.fail(`Should not have passed: ${v}`),
    });

  t.end();
});

test('Decoder.elseDo', (t) => {
  string
    .elseDo((v) => t.fail(`Should not run side-effect: ${v}`))
    .decodeAny('foo')
    .cata({
      Err: (m) => t.fail(`should succeed: ${m}`),
      Ok: (v) => t.equal('foo', v),
    });

  string
    .elseDo((v) => t.pass(`Should run side-effect: ${v}`))
    .decodeAny(42)
    .cata({
      Err: (m) => t.pass(`should have failed: ${m}`),
      Ok: (v) => t.fail(`Should not have passed: ${v}`),
    });

  t.end();
});

test('complex binding', (t) => {
  field('foo', string)
    .andThen((a) =>
      field('bar', number).andThen((b) => succeed({ s: a, n: b }))
    )
    .decodeAny({ foo: 'baz', bar: 42 })
    .cata({
      Err: (m) => t.fail(`expected a successful decode: ${m}`),
      Ok: (v) => t.pass(`object built!: ${JSON.stringify(v)}`),
    });

  field('foo', string)
    .andThen((a) =>
      field('barn', number).andThen((b) => succeed({ s: a, n: b }))
    )
    .decodeAny({ foo: 'baz', bar: 42 })
    .cata({
      Err: (m) => t.pass(`decoder failed with: ${m}`),
      Ok: (v) => t.fail(`expected decoder to fail: ${v}`),
    });

  t.end();
});

test('assign chaining', (t) => {
  succeed({})
    .assign('x', field('foo', number))
    .assign('y', field('bar', number))
    .assign('z', (scope) => succeed(scope.x + scope.y).map(String))
    .decodeAny({ foo: 42, bar: 8 })
    .cata({
      Err: (m) => t.fail(`decoder should have passed: ${m}`),
      Ok: (v) => t.deepEqual(v, { x: 42, y: 8, z: '50' }),
    });

  succeed({})
    .assign('x', field('foo', number))
    .assign('y', field('bar', number))
    .assign('z', (scope) => succeed(scope.x + scope.y).map(String))
    .decodeAny({ foo: 42, bar: 'eight' })
    .cata({
      Err: (m) => t.pass(`decoder expected to fail: ${m}`),
      Ok: (v) => t.fail(`Decoder should have failed: ${JSON.stringify(v)}`),
    });

  t.end();
});

test('alternative', (t) => {
  const decoder = field(
    'foo',
    string.orElse((_) => number.map((n) => n.toString()))
  );
  decoder.decodeAny({ foo: 'hi' }).cata({
    Err: (m) => t.fail(`string alternative should have passed: ${m}`),
    Ok: (v) => t.pass(`string alternative passed: ${v}`),
  });
  decoder.decodeAny({ foo: 42 }).cata({
    Err: (m) => t.fail(`number alternative should have passed: ${m}`),
    Ok: (v) => t.pass(`number alternative passed: ${v}`),
  });
  decoder.decodeAny({ foo: null }).cata({
    Err: (m) => t.pass(`null alternative failed: ${m}`),
    Ok: (v) => t.fail(`null alternative should have failed: ${v}`),
  });
  t.end();
});

test('optional primitive', (t) => {
  maybe(string)
    .decodeJson('"foo"')
    .cata({
      Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
      Ok: (mv) =>
        t.equal('foo', mv.getOrElseValue('oops!'), `optional value passed`),
    });

  maybe(string)
    .decodeJson('42')
    .cata({
      Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
      Ok: (mv) =>
        t.equal('oops!', mv.getOrElseValue('oops!'), 'optional fail passed'),
    });

  maybe(date)
    .decodeJson('null')
    .cata({
      Err: (m) => t.fail(`maybe should never fail: ${m}`),
      Ok: (v) =>
        v.cata({
          Nothing: () => t.pass('should not be a date'),
          Just: (v1) => t.fail(`shouldn't have a date: ${v1}`),
        }),
    });

  t.end();
});

test('optional field value', (t) => {
  const decoder = field('foo', maybe(string));
  decoder.decodeJson('{ "foo": "bar" }').cata({
    Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
    Ok: (mv) => t.equal('bar', mv.getOrElseValue('')),
  });
  decoder.decodeAny({ foo: 42 }).cata({
    Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
    Ok: (mv) => t.equal('oops!', mv.getOrElseValue('oops!')),
  });
  decoder.decodeAny({ bar: 'foo' }).cata({
    Err: (m) => t.pass(`field not optional failed: ${m}`),
    Ok: (mv) => t.fail(`field was not optional: ${mv}`),
  });
  t.end();
});

test('optional field', (t) => {
  const decoder = maybe(field('foo', string));
  decoder.decodeAny({ foo: 'bar' }).cata({
    Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
    Ok: (mv) => t.equal('bar', mv.getOrElseValue('bar')),
  });
  decoder.decodeAny({ bar: 'baz' }).cata({
    Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
    Ok: (mv) => t.equal('oops!', mv.getOrElseValue('oops!')),
  });
  decoder.decodeAny({ foo: 42 }).cata({
    Err: (m) => t.fail(`optional decoders should always pass: ${m}`),
    Ok: (mv) => t.equal('oops!', mv.getOrElseValue('oops!')),
  });
  t.end();
});

test('nullable', (t) => {
  const decoder = nullable(string);

  decoder.decodeAny('foo').cata({
    Err: (m) => t.fail(`nullable string should've passed: ${m}`),
    Ok: (v) =>
      v.cata({ Nothing: () => t.fail('unexpected nothing'), Just: t.pass }),
  });

  decoder.decodeAny(null).cata({
    Err: (m) => t.fail(`nullable should allow null: ${m}`),
    Ok: (v) => v.cata({ Nothing: () => t.pass('nothing'), Just: t.fail }),
  });

  decoder.decodeAny(42).cata({
    Err: t.pass,
    Ok: (v) =>
      t.fail(`nullable shouldn't mask decoder fails: ${JSON.stringify(v)}`),
  });

  t.end();
});

test('oneOf', (t) => {
  const numberToString = number.map((n) => n.toString());
  const decoder = oneOf([string, numberToString]);

  decoder.decodeAny(undefined).cata({
    Err: (m) => t.pass(`oneOf didn't match anything: ${m}`),
    Ok: (v) => t.fail(`should not have matched anything: ${v}`),
  });

  decoder.decodeAny(undefined).cata({
    Err: (m) => {
      t.assert(m.indexOf('I found the following problems:') >= 0);
    },
    Ok: (v) => t.fail(`should not have matched anything: ${v}`),
  });

  t.end();
});

test('keyValuePairs', (t) => {
  const decoder = keyValuePairs(number);

  decoder.decodeAny(undefined).cata({
    Err: (m) => t.pass(`keyValues needs an object: ${m}`),
    Ok: (v) => t.fail(`should have failed: ${v}`),
  });

  decoder.decodeAny({ foo: 42, bar: 'two' }).cata({
    Err: (m) => t.pass(`internal keyValue decoder failed: ${m}`),
    Ok: (v) => t.pass(`should have failed: ${v}`),
  });

  decoder.decodeAny({ foo: 42, bar: 2 }).cata({
    Err: (m) => t.fail(`should have passed: ${m}`),
    Ok: (v) =>
      t.deepEqual(v, [
        ['foo', 42],
        ['bar', 2],
      ]),
  });

  t.end();
});

test('dict', (t) => {
  const decoder = dict(number);

  decoder.decodeAny({ foo: 42, bar: 2 }).cata({
    Err: (err) => t.fail(`should have passed: ${err}`),
    Ok: (v) => {
      t.equal(42, v.get('foo'));
      t.equal(2, v.get('bar'));
    },
  });

  t.end();
});

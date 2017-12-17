import * as test from 'tape';
import {
  array,
  at,
  boolean,
  date,
  field,
  maybe,
  nullable,
  number,
  oneOf,
  string,
  succeed,
} from '../src/index';

test('string decoder', t => {
  string.decodeJson('"foo"').cata({
    Err: m => t.fail(`string decoder should have succeeded: ${m}`),
    Ok: v => t.pass(`string decoder worked on ${v}`),
  });

  string.decodeJson('8').cata({
    Err: m => t.pass(`string decoder failed with: ${m}`),
    Ok: v => t.fail(`string decoder should have failed on ${v}`),
  });

  t.end();
});

test('number decoder', t => {
  number.decodeJson('42').cata({
    Err: m => t.fail(`number decoder should have succeeded: ${m}`),
    Ok: v => t.pass(`number decoder worked on ${v}`),
  });

  number.decodeJson('"foo"').cata({
    Err: m => t.pass(`number decoder failed with: ${m}`),
    Ok: v => t.fail(`number decoder should have failed on ${v}`),
  });

  t.end();
});

test('boolean decoder', t => {
  boolean.decodeJson('true').cata({
    Err: m => t.fail(`boolean decoder should have passed: ${m}`),
    Ok: v => t.pass(`boolean decoder worked on ${v}`),
  });

  boolean.decodeJson('"foo"').cata({
    Err: m => t.pass(`boolean decoder failed: ${m}`),
    Ok: v => t.fail(`boolean decoder should have failed on ${v}`),
  });

  t.end();
});

test('date decoder', t => {
  date.decodeJson('"12/1/2016"').cata({
    Err: m => t.fail(`date decoder should have passed: ${m}`),
    Ok: v => t.pass(`date decoder worked on ${v}`),
  });

  date.decodeJson('"foo"').cata({
    Err: m => t.pass(`date decoder failed: ${m}`),
    Ok: v => t.fail(`Expected date decoder to fail: ${v}`),
  });

  t.end();
});

test('array decoder', t => {
  array(string).decodeJson('["foo", "bar", "baz"]').cata({
    Err: m => t.fail(`array decoder should have passed: ${m}`),
    Ok: v => t.pass(`array decoder passed: ${v}`),
  });

  array(string).decodeJson('["foo", 42, "bar"]').cata({
    Err: m => t.pass(`array decoder failed: ${m}`),
    Ok: v => t.fail(`array decoder should have failed: ${v}`),
  });

  t.end();
});

test('field decoder', t => {
  field('foo', string).decodeJson('{ "foo": "bar" }').cata({
    Err: m => t.fail(`field decoder should have passed: ${m}`),
    Ok: v => t.pass(`field decoder worked. Returned: ${v}`),
  });

  field('foo', string).decodeJson('{ "bar": "baz" }').cata({
    Err: m => t.pass(`field decoder failed: ${m}`),
    Ok: v => t.fail(`field decoder should have failed: ${v}`),
  });

  field('foo', string).decodeJson('{ "foo": 42 }').cata({
    Err: m => t.pass(`field decoder failed: ${m}`),
    Ok: v => t.fail(`field decoder should have failed: ${v}`),
  });

  field('foo', string).decodeAny(null).cata({
    Err: m => t.pass(`field decoder failed: ${m}`),
    Ok: v => t.fail(`field decoder should have failed: ${v}`),
  });

  t.end();
});

test('at decoder', t => {
  at([ 'foo', 0, 'bar' ], number).decodeAny({ foo: [ { bar: 42 } ] }).cata({
    Err: m => t.fail(`Expected path to pass: ${m}`),
    Ok: v => t.pass(`at decoder worked. Returned: ${v}`),
  });

  at([ 'foo', 1, 'bar' ], number).decodeAny({ foo: [ { bar: 42 } ] }).cata({
    Err: m => t.pass(`at failed with: ${m}`),
    Ok: v => t.fail(`at should have failed: ${v}`),
  });

  t.end();
});

test('decoder mapping', t => {
  string.map(s => s.toUpperCase()).decodeJson('"foo"').cata({
    Err: m => t.fail(`mapping a decoder should pass: ${m}`),
    Ok: v => t.pass(`mapping a decoder passed: ${v}`),
  });

  string.map(s => s.toUpperCase()).decodeJson('42').cata({
    Err: m => t.pass(`mapping failed decoders returns errors: ${m}`),
    Ok: v => t.pass(`mapping failed decoders should fail: ${v}`),
  });

  t.end();
});

test('decoder binding', t => {
  field('foo', string).andThen(a => succeed({ baz: a })).decodeJson('{"foo":"bar"}').cata({
    Err: m => t.fail(`andThen should have passed: ${m}`),
    Ok: v => t.pass(`andThen passed with value: ${JSON.stringify(v)}`),
  });

  t.end();
});

test('complex binding', t => {
  field('foo', string)
    .andThen(a => field('bar', number).andThen(b => succeed({ s: a, n: b })))
    .decodeAny({ foo: 'baz', bar: 42 })
    .cata({
      Err: m => t.fail(`expected a successful decode: ${m}`),
      Ok: v => t.pass(`object built!: ${JSON.stringify(v)}`),
    });

  field('foo', string)
    .andThen(a => field('barn', number).andThen(b => succeed({ s: a, n: b })))
    .decodeAny({ foo: 'baz', bar: 42 })
    .cata({
      Err: m => t.pass(`decoder failed with: ${m}`),
      Ok: v => t.pass(`expected decoder to fail: ${v}`),
    });

  t.end();
});

test('alternative', t => {
  const decoder = field('foo', string.orElse(_ => number.map(n => n.toString())));
  decoder.decodeAny({ foo: 'hi' }).cata({
    Err: m => t.fail(`string alternative should have passed: ${m}`),
    Ok: v => t.pass(`string alternative passed: ${v}`),
  });
  decoder.decodeAny({ foo: 42 }).cata({
    Err: m => t.fail(`number alternative should have passed: ${m}`),
    Ok: v => t.pass(`number alternative passed: ${v}`),
  });
  decoder.decodeAny({ foo: null }).cata({
    Err: m => t.pass(`null alternative failed: ${m}`),
    Ok: v => t.fail(`null alternative should have failed: ${v}`),
  });
  t.end();
});

test('optional primitive', t => {
  const decoder = maybe(string);
  decoder.decodeJson('"foo"').cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('foo', mv.getOrElseValue('oops!'), `optional value passed`),
  });
  decoder.decodeJson('42').cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('oops!', mv.getOrElseValue('oops!'), 'optional fail passed'),
  });
  t.end();
});

test('optional field value', t => {
  const decoder = field('foo', maybe(string));
  decoder.decodeJson('{ "foo": "bar" }').cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('bar', mv.getOrElseValue('')),
  });
  decoder.decodeAny({ foo: 42 }).cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('oops!', mv.getOrElseValue('oops!')),
  });
  decoder.decodeAny({ bar: 'foo' }).cata({
    Err: m => t.pass(`field not optional failed: ${m}`),
    Ok: mv => t.fail(`field was not optional: ${mv}`),
  });
  t.end();
});

test('optional field', t => {
  const decoder = maybe(field('foo', string));
  decoder.decodeAny({ foo: 'bar' }).cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('bar', mv.getOrElseValue('bar')),
  });
  decoder.decodeAny({ bar: 'baz' }).cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('oops!', mv.getOrElseValue('oops!')),
  });
  decoder.decodeAny({ foo: 42 }).cata({
    Err: m => t.fail(`optional decoders should always pass: ${m}`),
    Ok: mv => t.equal('oops!', mv.getOrElseValue('oops!')),
  });
  t.end();
});

test('nullable', t => {
  const decoder = nullable(string);

  decoder.decodeAny('foo').cata({
    Err: m => t.fail(`nullable string should've passed: ${m}`),
    Ok: v => v.cata({ Nothing: () => t.fail('unexpected nothing'), Just: t.pass }),
  });

  decoder.decodeAny(null).cata({
    Err: m => t.fail(`nullable should allow null: ${m}`),
    Ok: v => v.cata({ Nothing: () => t.pass('nothing'), Just: t.fail }),
  });

  decoder.decodeAny(42).cata({
    Err: t.pass,
    Ok: v => t.fail(`nullable shouldn't mask decoder fails: ${JSON.stringify(v)}`),
  });

  t.end();
});

test('oneOf', t => {
  const numberToString = number.map(n => n.toString());
  const decoder = oneOf([ string, numberToString ]);

  decoder.decodeAny(undefined).cata({
    Err: m => t.pass(`oneOf didn't match anything: ${m}`),
    Ok: v => t.fail(`should not have matched anything: ${v}`),
  });

  t.end();
});

test('applicative', t => {
  const ctor = (s: string) => (n: number) => ({ s, n });
  const decoder = succeed(ctor).ap(field('foo', string)).ap(field('bar', number));

  decoder.decodeAny({ foo: 'baz', bar: 42 }).cata({
    Err: m => t.fail(`should have succeeded: ${m}`),
    Ok: v => t.pass(`Worked!: ${JSON.stringify(v)}`),
  });
  t.end();
});

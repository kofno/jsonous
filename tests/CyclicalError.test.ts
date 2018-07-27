import * as test from 'tape';
import { field, number } from '../src';

interface Cyclical {
  value: string;
  myself?: Cyclical;
}

test('Report error on cyclical objects', t => {
  const cyclical: Cyclical = { value: 'foo' };
  cyclical.myself = cyclical;

  field('value', number).decodeAny(cyclical).cata({
    Err: msg => t.pass(`Expected it to fail and not crash: ${msg}`),
    Ok: v => t.fail(`Expected if to fail and not crash: ${v}`),
  });

  t.end();
});

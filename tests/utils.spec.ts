import { describe, expect, it } from 'bun:test';
import { safeStringify } from '../src/utils';

describe('safeStringify', () => {
  it('should stringify a simple object', () => {
    const obj = { a: 1, b: 'hello' };
    expect(safeStringify(obj)).toBe('{"a":1,"b":"hello"}');
  });

  it('should stringify an array', () => {
    const arr = [1, 2, 3];
    expect(safeStringify(arr)).toBe('[1,2,3]');
  });

  it('should stringify a string', () => {
    const str = 'hello';
    expect(safeStringify(str)).toBe('"hello"');
  });

  it('should stringify a number', () => {
    const num = 123;
    expect(safeStringify(num)).toBe('123');
  });

  it('should stringify a boolean', () => {
    const bool = true;
    expect(safeStringify(bool)).toBe('true');
  });

  it('should stringify null', () => {
    expect(safeStringify(null)).toBe('null');
  });

  it('should stringify undefined', () => {
    expect(safeStringify(undefined)).toBe(JSON.stringify(undefined));
  });

  it('should handle cyclical references', () => {
    const obj: any = { a: 1 };
    obj.b = obj;
    expect(safeStringify(obj)).toBe('{"a":1,"b":"[Cyclical Reference]"}');
  });

  it('should handle nested cyclical references', () => {
    const obj1: any = { a: 1 };
    const obj2: any = { b: obj1 };
    obj1.c = obj2;
    expect(safeStringify(obj1)).toBe('{"a":1,"c":{"b":"[Cyclical Reference]"}}');
  });

  it('should handle multiple cyclical references', () => {
    const obj1: any = { a: 1 };
    const obj2: any = { b: obj1 };
    obj1.c = obj2;
    obj2.d = obj1;
    expect(safeStringify(obj1)).toBe(
      '{"a":1,"c":{"b":"[Cyclical Reference]","d":"[Cyclical Reference]"}}'
    );
  });

  it('should handle cyclical references in arrays', () => {
    const arr: any[] = [1, 2];
    arr.push(arr);
    expect(safeStringify(arr)).toBe('[1,2,"[Cyclical Reference]"]');
  });

  it('should handle cyclical references in nested arrays', () => {
    const arr1: any[] = [1, 2];
    const arr2: any[] = [3, arr1];
    arr1.push(arr2);
    expect(safeStringify(arr1)).toBe('[1,2,[3,"[Cyclical Reference]"]]');
  });

  it('should handle cyclical references with different types', () => {
    const obj: any = { a: 1 };
    const arr: any[] = [obj];
    obj.b = arr;
    expect(safeStringify(obj)).toBe('{"a":1,"b":["[Cyclical Reference]"]}');
  });
});

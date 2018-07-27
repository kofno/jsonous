import 'weakset';

/*
 * Based on this code: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
 */
const cyclicalReferenceReplacer = () => {
  const seen = new WeakSet();
  return (_: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Cyclical Reference]';
      }
      seen.add(value);
    }
    return value;
  };
};

export const stringify = (value: any): string => JSON.stringify(value, cyclicalReferenceReplacer());

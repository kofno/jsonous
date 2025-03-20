/**
 * Safely converts a JavaScript value to a JSON string, handling cyclical references.
 *
 * @param value - The value to be stringified.
 * @returns The JSON string representation of the value.
 */
export function safeStringify(value: any): string {
  return JSON.stringify(value, cyclicalReferenceReplacer());
}

/**
 * Creates a replacer function for JSON.stringify that handles cyclical references.
 *
 * This function returns a replacer function that can be used with JSON.stringify
 * to replace cyclical references with the string '[Cyclical Reference]'. It uses
 * a WeakSet to keep track of objects that have already been seen during the
 * stringification process.
 *
 * Based on this code: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
 *
 * @returns A replacer function for JSON.stringify that replaces cyclical references.
 */
function cyclicalReferenceReplacer() {
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
}

/**
 * A generic function that returns the value it receives as an argument.
 *
 * @template T - The type of the value.
 * @param {T} value - The value to be returned.
 * @returns {T} The same value that was passed as an argument.
 */
export function identity<T>(value: T): T {
  return value;
}

/**
 * Converts a snake_case string to camelCase.
 *
 * @param str - The snake_case string to be converted.
 * @returns The converted camelCase string.
 */
export function camelCase(str: string): string {
  return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

/**
 * Converts a camelCase string to snake_case.
 *
 * @param str - The camelCase string to be converted.
 * @returns The converted snake_case string.
 *
 * @example
 * ```typescript
 * const result = camelCaseToSnakeCase('camelCaseString');
 * console.log(result); // Outputs: camel_case_string
 * ```
 */
export function snakeCase(str: string): string {
  return str.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
}

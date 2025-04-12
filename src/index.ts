// src/index.ts

// Base Decoders
export { boolean, fail, number, string, succeed } from './base';

// Container Decoders
export { array, at, field } from './containers';

// Associative Decoders
export { dict, keyValuePairs, objectOf } from './associative';

// Presence Decoders
export { maybe, nullable } from './presence';

// Date Decoders
export { date, dateISO, dateJSON } from './dates';

// Predicates
export { eql } from './predicates';

// Structures
export { createDecoderFromStructure, oneOf, stringLiteral, discriminatedUnion } from './structures';

// Decoder Class
export { default as Decoder } from './Decoder';

// Strings
export { regex } from './strings';

// Types
export type { InferType, InferTypeFromFn } from './types';

// Utils
export { camelCase, identity, safeStringify, snakeCase } from './utils';

// Types
export type { DecoderFn } from './Decoder';

// src/index.ts

// Base Decoders
export { boolean, eql, fail, number, string, stringLiteral, succeed } from './base';

// Container Decoders
export { array, at, field } from './containers';

// Associative Decoders
export { dict, keyValuePairs } from './associative';

// Presence Decoders
export { maybe, nullable } from './presence';

// Date Decoders
export { date, dateISO, dateJSON } from './dates';

// Structures
export { createDecoderFromStructure, oneOf } from './structures';

// Decoder Class
export { default as Decoder } from './Decoder';

// Types
export type { InferType, InferTypeFromFn } from './types';

// Utils
export { camelCase, identity, safeStringify, snakeCase } from './utils';

// Types
export type { DecoderFn } from './Decoder';

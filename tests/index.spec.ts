import { describe, expect, it } from 'bun:test';

// Base Decoders
import { boolean, eql, fail, number, string, stringLiteral, succeed } from '../src/index';

// Container Decoders
import { array, at, field } from '../src/index';

// Associative Decoders
import { dict, keyValuePairs } from '../src/index';

// Presence Decoders
import { maybe, nullable } from '../src/index';

// Date Decoders
import { date, dateISO, dateJSON } from '../src/index';

// Structures
import { createDecoderFromStructure, oneOf } from '../src/index';

// Decoder Class
import { Decoder } from '../src/index';

// Types

// Utils
import { camelCase, identity, safeStringify, snakeCase } from '../src/index';

describe('index', () => {
  describe('Base Decoders', () => {
    it('should re-export boolean', () => {
      expect(boolean).toBeDefined();
    });

    it('should re-export eql', () => {
      expect(eql).toBeDefined();
    });

    it('should re-export fail', () => {
      expect(fail).toBeDefined();
    });

    it('should re-export number', () => {
      expect(number).toBeDefined();
    });

    it('should re-export string', () => {
      expect(string).toBeDefined();
    });

    it('should re-export stringLiteral', () => {
      expect(stringLiteral).toBeDefined();
    });

    it('should re-export succeed', () => {
      expect(succeed).toBeDefined();
    });
  });

  describe('Container Decoders', () => {
    it('should re-export array', () => {
      expect(array).toBeDefined();
    });

    it('should re-export at', () => {
      expect(at).toBeDefined();
    });

    it('should re-export field', () => {
      expect(field).toBeDefined();
    });
  });

  describe('Associative Decoders', () => {
    it('should re-export dict', () => {
      expect(dict).toBeDefined();
    });

    it('should re-export keyValuePairs', () => {
      expect(keyValuePairs).toBeDefined();
    });
  });

  describe('Presence Decoders', () => {
    it('should re-export maybe', () => {
      expect(maybe).toBeDefined();
    });

    it('should re-export nullable', () => {
      expect(nullable).toBeDefined();
    });
  });

  describe('Date Decoders', () => {
    it('should re-export date', () => {
      expect(date).toBeDefined();
    });

    it('should re-export dateISO', () => {
      expect(dateISO).toBeDefined();
    });

    it('should re-export dateJSON', () => {
      expect(dateJSON).toBeDefined();
    });
  });

  describe('Structures', () => {
    it('should re-export createDecoderFromStructure', () => {
      expect(createDecoderFromStructure).toBeDefined();
    });

    it('should re-export oneOf', () => {
      expect(oneOf).toBeDefined();
    });
  });

  describe('Decoder Class', () => {
    it('should re-export Decoder', () => {
      expect(Decoder).toBeDefined();
    });
  });

  describe('Utils', () => {
    it('should re-export camelCase', () => {
      expect(camelCase).toBeDefined();
    });

    it('should re-export identity', () => {
      expect(identity).toBeDefined();
    });

    it('should re-export safeStringify', () => {
      expect(safeStringify).toBeDefined();
    });

    it('should re-export snakeCase', () => {
      expect(snakeCase).toBeDefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  assertString,
  assertOptString,
  assertBool,
  assertNumber,
  assertArray,
  assertObject,
} from '../../src/lib/validate';

describe('lib/validate — anti-corruption validators', () => {
  describe('assertString', () => {
    it('passes through valid strings', () => {
      expect(() => assertString('hi', 'f')).not.toThrow();
      expect(() => assertString('', 'f')).not.toThrow();
    });
    it('throws on non-strings', () => {
      expect(() => assertString(42, 'f')).toThrow('[anti-corruption] f must be a string');
      expect(() => assertString(null, 'f')).toThrow('null');
      expect(() => assertString(undefined, 'f')).toThrow('undefined');
      expect(() => assertString([], 'f')).toThrow('array');
      expect(() => assertString({}, 'f')).toThrow('object');
    });
    it('includes parent path in the message when provided', () => {
      expect(() => assertString(42, 'child', 'Parent')).toThrow('Parent.child must be a string');
    });
  });

  describe('assertOptString', () => {
    it('allows null and undefined', () => {
      expect(() => assertOptString(null, 'f')).not.toThrow();
      expect(() => assertOptString(undefined, 'f')).not.toThrow();
    });
    it('allows strings', () => {
      expect(() => assertOptString('x', 'f')).not.toThrow();
    });
    it('rejects other types', () => {
      expect(() => assertOptString(true, 'f')).toThrow('boolean');
      expect(() => assertOptString([], 'f')).toThrow('array');
    });
  });

  describe('assertBool', () => {
    it('accepts true/false', () => {
      expect(() => assertBool(true, 'b')).not.toThrow();
      expect(() => assertBool(false, 'b')).not.toThrow();
    });
    it('rejects truthy/falsy non-booleans', () => {
      expect(() => assertBool(1, 'b')).toThrow('number');
      expect(() => assertBool(0, 'b')).toThrow('number');
      expect(() => assertBool('true', 'b')).toThrow('string');
    });
  });

  describe('assertNumber', () => {
    it('accepts numbers (incl. NaN/Infinity)', () => {
      expect(() => assertNumber(0, 'n')).not.toThrow();
      expect(() => assertNumber(3.14, 'n')).not.toThrow();
    });
    it('rejects non-numbers', () => {
      expect(() => assertNumber('3', 'n')).toThrow('string');
      expect(() => assertNumber(null, 'n')).toThrow('null');
    });
  });

  describe('assertArray', () => {
    it('returns the array on success', () => {
      expect(assertArray([1, 2], 'a')).toEqual([1, 2]);
    });
    it('rejects non-arrays', () => {
      expect(() => assertArray({}, 'a')).toThrow('object');
      expect(() => assertArray(null, 'a')).toThrow('null');
    });
  });

  describe('assertObject', () => {
    it('returns the object on success', () => {
      const o = { x: 1 };
      expect(assertObject(o, 'o')).toBe(o);
    });
    it('rejects null, arrays, primitives', () => {
      expect(() => assertObject(null, 'o')).toThrow('null');
      expect(() => assertObject([], 'o')).toThrow('array');
      expect(() => assertObject('x', 'o')).toThrow('string');
      expect(() => assertObject(undefined, 'o')).toThrow('undefined');
    });
  });
});

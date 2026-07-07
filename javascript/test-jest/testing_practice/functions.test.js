import { capitalize, reverseString, calculator, caesarCipher, analyzeArray } from './functions';

describe('capitalize', () => {
    test('capitalizes the first character of a lowercase word', () => {
        expect(capitalize('hello')).toBe('Hello');
    });

    test('keeps an already-capitalized word unchanged', () => {
        expect(capitalize('Hello')).toBe('Hello');
    });

    test('works with a single character', () => {
        expect(capitalize('a')).toBe('A');
    });

    test('returns an empty string when given an empty string', () => {
        expect(capitalize('')).toBe('');
    });

    test('does not alter characters after the first one', () => {
        expect(capitalize('hELLO')).toBe('HELLO');
    });
});

describe('reverseString', () => {
    test('reverses a regular word', () => {
        expect(reverseString('hello')).toBe('olleh');
    });

    test('reverses a sentence', () => {
        expect(reverseString('Howdy')).toBe('ydwoH');
    });

    test('returns an empty string for an empty string', () => {
        expect(reverseString('')).toBe('');
    });

    test('handles a palindrome', () => {
        expect(reverseString('racecar')).toBe('racecar');
    });
});

describe('calculator', () => {
    test('adds two numbers', () => {
        expect(calculator.add(2, 3)).toBe(5);
    });

    test('subtracts two numbers', () => {
        expect(calculator.subtract(10, 4)).toBe(6);
    });

    test('multiplies two numbers', () => {
        expect(calculator.multiply(3, 7)).toBe(21);
    });

    test('divides two numbers', () => {
        expect(calculator.divide(10, 2)).toBe(5);
    });

    test('handles decimal division', () => {
        expect(calculator.divide(5, 2)).toBe(2.5);
    });

    test('throws when dividing by zero', () => {
        expect(() => calculator.divide(5, 0)).toThrow('Cannot divide by zero');
    });

    test('works with negative numbers', () => {
        expect(calculator.add(-2, -3)).toBe(-5);
        expect(calculator.subtract(-2, 3)).toBe(-5);
        expect(calculator.multiply(-2, 3)).toBe(-6);
        expect(calculator.divide(-10, 2)).toBe(-5);
    });
});

// ============================================================
//  caesarCipher
// ============================================================
describe('caesarCipher', () => {
    test('shifts lowercase letters', () => {
        expect(caesarCipher('abc', 3)).toBe('def');
    });

    test('wraps from z to a', () => {
        expect(caesarCipher('xyz', 3)).toBe('abc');
    });

    test('preserves letter case', () => {
        expect(caesarCipher('HeLLo', 3)).toBe('KhOOr');
    });

    test('keeps punctuation, spaces, and non-alphabetical characters unchanged', () => {
        expect(caesarCipher('Hello, World!', 3)).toBe('Khoor, Zruog!');
    });

    test('handles a shift of 0', () => {
        expect(caesarCipher('Hello', 0)).toBe('Hello');
    });

    test('handles a full 26-shift (identity)', () => {
        expect(caesarCipher('Hello', 26)).toBe('Hello');
    });

    test('handles negative shifts', () => {
        expect(caesarCipher('def', -3)).toBe('abc');
    });
});

// ============================================================
//  analyzeArray
// ============================================================
describe('analyzeArray', () => {
    test('returns correct analysis for a standard array', () => {
        expect(analyzeArray([1, 8, 3, 4, 2, 6])).toEqual({
            average: 4,
            min: 1,
            max: 8,
            length: 6,
        });
    });

    test('handles a single-element array', () => {
        expect(analyzeArray([5])).toEqual({
            average: 5,
            min: 5,
            max: 5,
            length: 1,
        });
    });

    test('handles negative numbers', () => {
        expect(analyzeArray([-3, -1, -7])).toEqual({
            average: -11 / 3,
            min: -7,
            max: -1,
            length: 3,
        });
    });

    test('throws for an empty array', () => {
        expect(() => analyzeArray([])).toThrow('Array must not be empty');
    });
});

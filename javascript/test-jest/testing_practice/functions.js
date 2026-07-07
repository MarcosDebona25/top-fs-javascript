function capitalize(str) {
    if (str === '') return '';
    return str[0].toUpperCase() + str.slice(1);
}

function reverseString(str) {
    return str.split('').reverse().join('');
}

const calculator = {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
    multiply: (a, b) => a * b,
    divide: (a, b) => {
        if (b === 0) throw new Error('Cannot divide by zero');
        return a / b;
    },
};

function shiftChar(char, shift) {
    const isUpper = char >= 'A' && char <= 'Z';
    const isLower = char >= 'a' && char <= 'z';
    if (!isUpper && !isLower) return char;

    const base = isUpper ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
}

function caesarCipher(str, shift) {
    return str
        .split('')
        .map((ch) => shiftChar(ch, shift))
        .join('');
}

function analyzeArray(arr) {
    if (!arr.length) throw new Error('Array must not be empty');

    const sum = arr.reduce((acc, n) => acc + n, 0);
    return {
        average: sum / arr.length,
        min: Math.min(...arr),
        max: Math.max(...arr),
        length: arr.length,
    };
}

export { capitalize, reverseString, calculator, caesarCipher, analyzeArray };
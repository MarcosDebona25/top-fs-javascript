import sum from './sum';

// ────────────────────────────────────────────────────────────
//  1. toBe  —  Igualdad exacta (usa Object.is)
//     Ideal para primitivos: numbers, strings, booleans.
// ────────────────────────────────────────────────────────────

test('toBe — compara primitivos con igualdad exacta', () => {
    expect(sum(1, 2)).toBe(3);
    expect(sum(2, 2)).toBe(4);
});

// ────────────────────────────────────────────────────────────
//  2. toEqual / toStrictEqual  —  Igualdad profunda (objetos)
//     toEqual:       ignora undefined en keys, items y tipo.
//     toStrictEqual:  los tiene en cuenta.
// ────────────────────────────────────────────────────────────

test('toEqual — compara objetos por valor (deep equality)', () => {
    const data = { one: 1 };
    data['two'] = 2;
    expect(data).toEqual({ one: 1, two: 2 });
});

test('toStrictEqual — deep equality estricta (no ignora undefined ni tipo)', () => {
    // toEqual pasaría, toStrictEqual falla si hay diferencia de tipo o undefined
    expect({ a: 1 }).toStrictEqual({ a: 1 });
});

// ────────────────────────────────────────────────────────────
//  3. .not  —  Invierte cualquier matcher
// ────────────────────────────────────────────────────────────

test('.not — invierte el matcher', () => {
    for (let a = 1; a < 10; a++) {
        for (let b = 1; b < 10; b++) {
            expect(a + b).not.toBe(0);
        }
    }
});

// ────────────────────────────────────────────────────────────
//  4. Truthiness — null, undefined, truthy, falsy
// ────────────────────────────────────────────────────────────

test('toBeNull — solo coincide con null', () => {
    const n = null;
    expect(n).toBeNull();
    expect(n).toBeDefined();
    expect(n).not.toBeUndefined();
    expect(n).not.toBeTruthy();
    expect(n).toBeFalsy();
});

test('toBeFalsy — 0 es falsy pero no es null ni undefined', () => {
    const z = 0;
    expect(z).not.toBeNull();
    expect(z).toBeDefined();
    expect(z).not.toBeUndefined();
    expect(z).not.toBeTruthy();
    expect(z).toBeFalsy();
});

// ────────────────────────────────────────────────────────────
//  5. Números — comparaciones numéricas
// ────────────────────────────────────────────────────────────

test('comparaciones numéricas — greater, less, equal', () => {
    const value = 2 + 2;
    expect(value).toBeGreaterThan(3);
    expect(value).toBeGreaterThanOrEqual(3.5);
    expect(value).toBeLessThan(5);
    expect(value).toBeLessThanOrEqual(4.5);

    // toBe y toEqual son equivalentes para números
    expect(value).toBe(4);
    expect(value).toEqual(4);
});

test('toBeCloseTo — para floats (evita errores de redondeo)', () => {
    const value = 0.1 + 0.2;
    // expect(value).toBe(0.3);        // Falla por error de redondeo
    expect(value).toBeCloseTo(0.3);    // Funciona correctamente
});

// ────────────────────────────────────────────────────────────
//  6. Strings — coincidencia con regex
// ────────────────────────────────────────────────────────────

test('toMatch — verifica strings contra regex', () => {
    expect('team').not.toMatch(/I/);
    expect('Christoph').toMatch(/stop/);
});

// ────────────────────────────────────────────────────────────
//  7. Arrays / Iterables — contiene un elemento
// ────────────────────────────────────────────────────────────

const shoppingList = [
    'diapers',
    'kleenex',
    'trash bags',
    'paper towels',
    'milk',
];

test('toContain — verifica que un array/Set contenga un item', () => {
    expect(shoppingList).toContain('milk');
    expect(new Set(shoppingList)).toContain('milk');
});

// ────────────────────────────────────────────────────────────
//  8. Excepciones — verificar que una función lance un error
// ────────────────────────────────────────────────────────────

function compileAndroidCode() {
    throw new Error('you are using the wrong JDK!');
}

test('toThrow — verifica que se lance una excepción', () => {
    // IMPORTANTE: se envuelve en () => para que Jest capture el error
    expect(() => compileAndroidCode()).toThrow();           // lanza algo
    expect(() => compileAndroidCode()).toThrow(Error);      // lanza un Error

    // Coincidencia parcial con string
    expect(() => compileAndroidCode()).toThrow('you are using the wrong JDK');

    // Coincidencia con regex parcial
    expect(() => compileAndroidCode()).toThrow(/JDK/);

    // Coincidencia exacta con regex (^ y $ delimitan inicio y fin)
    // expect(() => compileAndroidCode()).toThrow(/^you are using the wrong JDK$/);  // ❌ Falta el !
    expect(() => compileAndroidCode()).toThrow(/^you are using the wrong JDK!$/);    // ✅ Match exacto
});
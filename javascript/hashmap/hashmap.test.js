const { HashMap } = require("./hashmap");

// Helper to log pass/fail
function assert(condition, label) {
    if (condition) {
        console.log(`  ✓ ${label}`);
    } else {
        console.error(`  ✗ ${label}`);
    }
}

// ── 1. Create and populate ──────────────────────────────────────────────────
console.log("\n1. Populate hash map with 12 entries (load → 0.75)");

const test = new HashMap();

test.set("apple", "red");
test.set("banana", "yellow");
test.set("carrot", "orange");
test.set("dog", "brown");
test.set("elephant", "gray");
test.set("frog", "green");
test.set("grape", "purple");
test.set("hat", "black");
test.set("ice cream", "white");
test.set("jacket", "blue");
test.set("kite", "pink");
test.set("lion", "golden");

assert(test.length() === 12, `length() === 12 (got ${test.length()})`);

// ── 2. Overwrite existing keys ──────────────────────────────────────────────
console.log("\n2. Overwrite a few keys (length must stay at 12)");

test.set("apple", "dark red");
test.set("banana", "bright yellow");
test.set("carrot", "deep orange");

assert(test.length() === 12, `length() === 12 after overwrites (got ${test.length()})`);
assert(test.get("apple") === "dark red", `apple → "dark red" (got "${test.get("apple")}")`);
assert(test.get("banana") === "bright yellow", `banana → "bright yellow" (got "${test.get("banana")}")`);
assert(test.get("carrot") === "deep orange", `carrot → "deep orange" (got "${test.get("carrot")}")`);

// ── 3. Exceed load factor → trigger resize ──────────────────────────────────
console.log("\n3. Add 'moon' → exceed load factor → trigger resize");

test.set("moon", "silver");

assert(test.length() === 13, `length() === 13 (got ${test.length()})`);

// ── 4. Overwrite after resize ───────────────────────────────────────────────
console.log("\n4. Overwrite keys after resize");

test.set("dog", "dark brown");
test.set("elephant", "dark gray");

assert(test.length() === 13, `length() still 13 (got ${test.length()})`);
assert(test.get("dog") === "dark brown", `dog → "dark brown" (got "${test.get("dog")}")`);
assert(test.get("elephant") === "dark gray", `elephant → "dark gray" (got "${test.get("elephant")}")`);

// ── 5. Test get() ───────────────────────────────────────────────────────────
console.log("\n5. get()");

assert(test.get("moon") === "silver", `get("moon") === "silver"`);
assert(test.get("frog") === "green", `get("frog") === "green"`);
assert(test.get("nonexistent") === null, `get("nonexistent") === null`);

// ── 6. Test has() ───────────────────────────────────────────────────────────
console.log("\n6. has()");

assert(test.has("apple") === true, `has("apple") === true`);
assert(test.has("moon") === true, `has("moon") === true`);
assert(test.has("nonexistent") === false, `has("nonexistent") === false`);

// ── 7. Test remove() ───────────────────────────────────────────────────────
console.log("\n7. remove()");

assert(test.remove("moon") === true, `remove("moon") === true`);
assert(test.has("moon") === false, `has("moon") === false after removal`);
assert(test.length() === 12, `length() === 12 after removal (got ${test.length()})`);
assert(test.remove("moon") === false, `remove("moon") again === false`);

// ── 8. Test keys(), values(), entries() ─────────────────────────────────────
console.log("\n8. keys(), values(), entries()");

const keys = test.keys();
const values = test.values();
const entries = test.entries();

assert(keys.length === 12, `keys() has 12 elements (got ${keys.length})`);
assert(values.length === 12, `values() has 12 elements (got ${values.length})`);
assert(entries.length === 12, `entries() has 12 pairs (got ${entries.length})`);

console.log("   keys:   ", keys);
console.log("   values: ", values);

// Verify every entry pair matches get()
const entriesValid = entries.every(([k, v]) => test.get(k) === v);
assert(entriesValid, "Every entry [key, value] matches get(key)");

// ── 9. Test clear() ─────────────────────────────────────────────────────────
console.log("\n9. clear()");

test.clear();

assert(test.length() === 0, `length() === 0 after clear (got ${test.length()})`);
assert(test.keys().length === 0, `keys() is empty after clear`);
assert(test.get("apple") === null, `get("apple") === null after clear`);

console.log("\nAll tests finished.\n");

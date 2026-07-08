const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { Node, LinkedList } = require("./linked-list.js");

// ============================================================
// Node class
// ============================================================
describe("Node", () => {
  it("should default value and nextNode to null", () => {
    const node = new Node();
    assert.strictEqual(node.value, null);
    assert.strictEqual(node.nextNode, null);
  });

  it("should accept a value argument", () => {
    const node = new Node(42);
    assert.strictEqual(node.value, 42);
    assert.strictEqual(node.nextNode, null);
  });

  it("should accept value and nextNode arguments", () => {
    const next = new Node(2);
    const node = new Node(1, next);
    assert.strictEqual(node.value, 1);
    assert.strictEqual(node.nextNode, next);
  });
});

// ============================================================
// LinkedList — append
// ============================================================
describe("append", () => {
  it("should add a node to an empty list", () => {
    const list = new LinkedList();
    list.append(1);
    assert.strictEqual(list.toString(), "( 1 ) -> null");
  });

  it("should add nodes to the end of the list", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> ( 3 ) -> null");
  });
});

// ============================================================
// LinkedList — prepend
// ============================================================
describe("prepend", () => {
  it("should add a node to an empty list", () => {
    const list = new LinkedList();
    list.prepend(1);
    assert.strictEqual(list.toString(), "( 1 ) -> null");
  });

  it("should add a node to the start of an existing list", () => {
    const list = new LinkedList();
    list.append(2);
    list.append(3);
    list.prepend(1);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> ( 3 ) -> null");
  });
});

// ============================================================
// LinkedList — size
// ============================================================
describe("size", () => {
  it("should return 0 for an empty list", () => {
    assert.strictEqual(new LinkedList().size(), 0);
  });

  it("should return the correct count after appending", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    assert.strictEqual(list.size(), 3);
  });
});

// ============================================================
// LinkedList — head
// ============================================================
describe("head", () => {
  it("should return undefined for an empty list", () => {
    assert.strictEqual(new LinkedList().head(), undefined);
  });

  it("should return the value of the first node", () => {
    const list = new LinkedList();
    list.append(10);
    list.append(20);
    assert.strictEqual(list.head(), 10);
  });
});

// ============================================================
// LinkedList — tail
// ============================================================
describe("tail", () => {
  it("should return undefined for an empty list", () => {
    assert.strictEqual(new LinkedList().tail(), undefined);
  });

  it("should return the value of the last node", () => {
    const list = new LinkedList();
    list.append(10);
    list.append(20);
    list.append(30);
    assert.strictEqual(list.tail(), 30);
  });

  it("should return the same value as head for a single-node list", () => {
    const list = new LinkedList();
    list.append(42);
    assert.strictEqual(list.tail(), list.head());
  });
});

// ============================================================
// LinkedList — at
// ============================================================
describe("at", () => {
  it("should return the value at a valid index", () => {
    const list = new LinkedList();
    list.append("a");
    list.append("b");
    list.append("c");
    assert.strictEqual(list.at(0), "a");
    assert.strictEqual(list.at(1), "b");
    assert.strictEqual(list.at(2), "c");
  });

  it("should return undefined for an out-of-bounds index", () => {
    const list = new LinkedList();
    list.append(1);
    assert.strictEqual(list.at(5), undefined);
  });

  it("should return undefined for a negative index", () => {
    const list = new LinkedList();
    list.append(1);
    assert.strictEqual(list.at(-1), undefined);
  });

  it("should return undefined on an empty list", () => {
    assert.strictEqual(new LinkedList().at(0), undefined);
  });
});

// ============================================================
// LinkedList — pop
// ============================================================
describe("pop", () => {
  it("should return undefined on an empty list", () => {
    assert.strictEqual(new LinkedList().pop(), undefined);
  });

  it("should remove and return the head value", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    assert.strictEqual(list.pop(), 1);
    assert.strictEqual(list.toString(), "( 2 ) -> ( 3 ) -> null");
  });

  it("should leave an empty list after popping the only node", () => {
    const list = new LinkedList();
    list.append(42);
    assert.strictEqual(list.pop(), 42);
    assert.strictEqual(list.size(), 0);
    assert.strictEqual(list.toString(), "");
  });
});

// ============================================================
// LinkedList — contains
// ============================================================
describe("contains", () => {
  it("should return false on an empty list", () => {
    assert.strictEqual(new LinkedList().contains(1), false);
  });

  it("should return true when the value exists", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    assert.strictEqual(list.contains(2), true);
  });

  it("should return false when the value does not exist", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    assert.strictEqual(list.contains(99), false);
  });
});

// ============================================================
// LinkedList — findIndex
// ============================================================
describe("findIndex", () => {
  it("should return -1 on an empty list", () => {
    assert.strictEqual(new LinkedList().findIndex(1), -1);
  });

  it("should return the index of an existing value", () => {
    const list = new LinkedList();
    list.append("x");
    list.append("y");
    list.append("z");
    assert.strictEqual(list.findIndex("y"), 1);
  });

  it("should return -1 when the value is not found", () => {
    const list = new LinkedList();
    list.append(1);
    assert.strictEqual(list.findIndex(99), -1);
  });

  it("should return the index of the first match when duplicates exist", () => {
    const list = new LinkedList();
    list.append(5);
    list.append(10);
    list.append(5);
    assert.strictEqual(list.findIndex(5), 0);
  });
});

// ============================================================
// LinkedList — toString
// ============================================================
describe("toString", () => {
  it("should return an empty string for an empty list", () => {
    assert.strictEqual(new LinkedList().toString(), "");
  });

  it("should format a single-node list", () => {
    const list = new LinkedList();
    list.append(1);
    assert.strictEqual(list.toString(), "( 1 ) -> null");
  });

  it("should format a multi-node list", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> ( 3 ) -> null");
  });
});

// ============================================================
// LinkedList — insertAt (extra credit)
// ============================================================
describe("insertAt", () => {
  it("should insert at the beginning (index 0)", () => {
    const list = new LinkedList();
    list.append(2);
    list.append(3);
    list.insertAt(0, 1);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> ( 3 ) -> null");
  });

  it("should insert in the middle", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    list.insertAt(1, 10, 11);
    assert.strictEqual(
      list.toString(),
      "( 1 ) -> ( 10 ) -> ( 11 ) -> ( 2 ) -> ( 3 ) -> null"
    );
  });

  it("should insert at the end (index === size)", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.insertAt(2, 3);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> ( 3 ) -> null");
  });

  it("should insert into an empty list at index 0", () => {
    const list = new LinkedList();
    list.insertAt(0, 1, 2);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> null");
  });

  it("should throw RangeError for negative index", () => {
    const list = new LinkedList();
    list.append(1);
    assert.throws(() => list.insertAt(-1, 99), RangeError);
  });

  it("should throw RangeError for index greater than size", () => {
    const list = new LinkedList();
    list.append(1);
    assert.throws(() => list.insertAt(5, 99), RangeError);
  });

  it("should do nothing when called with no values", () => {
    const list = new LinkedList();
    list.append(1);
    list.insertAt(0);
    assert.strictEqual(list.toString(), "( 1 ) -> null");
  });
});

// ============================================================
// LinkedList — removeAt (extra credit)
// ============================================================
describe("removeAt", () => {
  it("should remove the head node (index 0)", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    list.removeAt(0);
    assert.strictEqual(list.toString(), "( 2 ) -> ( 3 ) -> null");
  });

  it("should remove a middle node", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    list.removeAt(1);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 3 ) -> null");
  });

  it("should remove the last node", () => {
    const list = new LinkedList();
    list.append(1);
    list.append(2);
    list.append(3);
    list.removeAt(2);
    assert.strictEqual(list.toString(), "( 1 ) -> ( 2 ) -> null");
  });

  it("should remove the only node in a single-node list", () => {
    const list = new LinkedList();
    list.append(1);
    list.removeAt(0);
    assert.strictEqual(list.size(), 0);
    assert.strictEqual(list.toString(), "");
  });

  it("should throw RangeError for negative index", () => {
    const list = new LinkedList();
    list.append(1);
    assert.throws(() => list.removeAt(-1), RangeError);
  });

  it("should throw RangeError for index >= size", () => {
    const list = new LinkedList();
    list.append(1);
    assert.throws(() => list.removeAt(1), RangeError);
  });

  it("should throw RangeError on an empty list", () => {
    assert.throws(() => new LinkedList().removeAt(0), RangeError);
  });
});

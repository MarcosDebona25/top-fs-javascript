# Linked List Implementation in JavaScript

## Conceptual Explanation

### What is a Linked List?

A **Linked List** is a linear data structure where elements are **not stored in contiguous memory locations** (unlike arrays). Instead, each element (called a **node**) contains:

1. A **value** — the data it holds.
2. A **pointer** (reference) to the **next node** in the sequence.

Think of it like a scavenger hunt: each clue (node) tells you something (value) and where to find the next clue (nextNode).

```
 HEAD
  ↓
┌───────────┐    ┌───────────┐    ┌───────────┐
│ value: 10 │    │ value: 20 │    │ value: 30 │
│ next: ──────>  │ next: ──────>  │ next: null│
└───────────┘    └───────────┘    └───────────┘
                                       ↑
                                      TAIL
```

### Why use a Linked List instead of an Array?

| Feature             | Array                          | Linked List                                              |
| ------------------- | ------------------------------ | -------------------------------------------------------- |
| Access by index     | **O(1)** — instant             | **O(n)** — must traverse                                 |
| Insert at beginning | **O(n)** — shifts all elements | **O(1)** — just update head pointer                      |
| Insert at end       | **O(1)** amortized             | **O(n)** — must traverse to tail (O(1) if we track tail) |
| Memory              | Contiguous block               | Scattered, uses extra memory for pointers                |

Linked lists shine when you need **frequent insertions/deletions** at the beginning or middle of a collection, because no shifting is needed.

### The Two Building Blocks

#### 1. Node (the individual element)

A Node is the smallest unit. It wraps a value and holds a reference to the next node:

```
Node {
  value: <any>    // the data
  nextNode: <Node | null>  // pointer to next, or null if last
}
```

#### 2. LinkedList (the container)

The LinkedList doesn't store data directly — it just keeps a reference to the **head** (the first node). From the head, you can traverse the entire list by following `nextNode` pointers.

```
LinkedList {
  headNode: <Node | null>  // entry point to the chain
}
```

### How Each Operation Works Conceptually

#### `append(value)` — Add to the end

Traverse from head to the last node (where `nextNode === null`), then set that node's `nextNode` to a new node. If the list is empty, the new node becomes the head.

```
Before: (1) -> (2) -> null
append(3)
After:  (1) -> (2) -> (3) -> null
```

#### `prepend(value)` — Add to the beginning

Create a new node whose `nextNode` points to the current head, then update the head to the new node.

```
Before: (2) -> (3) -> null
prepend(1)
After:  (1) -> (2) -> (3) -> null
```

#### `size()` — Count all nodes

Start at the head. Walk through each node, incrementing a counter. When you reach `null`, return the counter.

#### `head()` — Get the first value

Simply return the value of the head node. If head is `null`, return `undefined`.

#### `tail()` — Get the last value

Traverse to the last node (where `nextNode === null`) and return its value.

#### `at(index)` — Get value at position

Starting from the head (index 0), hop through `nextNode` links `index` times. If you run out of nodes before reaching the index, return `undefined`.

#### `pop()` — Remove the first node

Save the head's value, then update the head to `head.nextNode`. Return the saved value.

```
Before: (1) -> (2) -> (3) -> null
pop() => returns 1
After:  (2) -> (3) -> null
```

#### `contains(value)` — Search for a value

Traverse the list. If any node's value matches, return `true`. If you reach `null` without a match, return `false`.

#### `findIndex(value)` — Find position of a value

Like `contains`, but track the index. Return the index on the first match, or `-1` if not found.

#### `toString()` — String representation

Walk through each node, building a string in the format: `( value ) -> ( value ) -> null`.

#### `insertAt(index, ...values)` — Insert nodes at a position

Find the node just **before** the target index, then splice the new nodes into the chain by updating `nextNode` pointers. Throws `RangeError` if index is out of bounds.

```
Before: (1) -> (2) -> (3) -> null
insertAt(1, 10, 11)
After:  (1) -> (10) -> (11) -> (2) -> (3) -> null
```

#### `removeAt(index)` — Remove a node at a position

Find the node just **before** the target index, then "skip over" the target node by updating the previous node's `nextNode` to point to the target's `nextNode`. Throws `RangeError` if index is out of bounds.

```
Before: (1) -> (2) -> (3) -> null
removeAt(1)
After:  (1) -> (3) -> null
```

---

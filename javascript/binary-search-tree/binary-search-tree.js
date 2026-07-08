class Node {
  constructor(data) {
    this.data = data;
    this.left = null;
    this.right = null;
  }
}

class Tree {
  constructor(array) {
    // Sort and remove duplicates before building
    const sorted = [...new Set(array)].sort((a, b) => a - b);
    this.root = this.#buildTree(sorted);
  }

  // Takes a sorted, deduplicated array and returns the root of a balanced BST
  #buildTree(array) {
    if (array.length === 0) return null;

    const mid = Math.floor(array.length / 2);
    const node = new Node(array[mid]);

    node.left = this.#buildTree(array.slice(0, mid));
    node.right = this.#buildTree(array.slice(mid + 1));

    return node;
  }

  // Returns true if value exists in the tree, false otherwise
  includes(value) {
    let current = this.root;

    while (current !== null) {
      if (value === current.data) return true;
      if (value < current.data) {
        current = current.left;
      } else {
        current = current.right;
      }
    }

    return false;
  }

  // Inserts a new node preserving BST property. Does nothing if value already exists.
  insert(value) {
    if (this.root === null) {
      this.root = new Node(value);
      return;
    }

    let current = this.root;

    while (current !== null) {
      // Duplicate — do nothing
      if (value === current.data) return;

      if (value < current.data) {
        if (current.left === null) {
          current.left = new Node(value);
          return;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = new Node(value);
          return;
        }
        current = current.right;
      }
    }
  }

  // Removes the node with the given value. Handles leaf, one-child, and two-children cases.
  deleteItem(value) {
    this.root = this.#deleteNode(this.root, value);
  }

  #deleteNode(node, value) {
    if (node === null) return null;

    if (value < node.data) {
      node.left = this.#deleteNode(node.left, value);
    } else if (value > node.data) {
      node.right = this.#deleteNode(node.right, value);
    } else {
      // Found the node to delete

      // Case 1: Leaf node
      if (node.left === null && node.right === null) return null;

      // Case 2: One child
      if (node.left === null) return node.right;
      if (node.right === null) return node.left;

      // Case 3: Two children - replace with in-order successor
      const successor = this.#findMin(node.right);
      node.data = successor.data;
      node.right = this.#deleteNode(node.right, successor.data);
    }

    return node;
  }

  // Returns the node with the smallest value in the given subtree
  #findMin(node) {
    let current = node;
    while (current.left !== null) {
      current = current.left;
    }
    return current;
  }

  // Breadth-first traversal. Calls callback with each value.
  levelOrderForEach(callback) {
    if (typeof callback !== 'function') {
      throw new Error('A callback function is required');
    }

    if (this.root === null) return;

    const queue = [this.root];

    while (queue.length > 0) {
      const current = queue.shift();
      callback(current.data);

      if (current.left !== null) queue.push(current.left);
      if (current.right !== null) queue.push(current.right);
    }
  }

  // Left → Root → Right
  inOrderForEach(callback) {
    if (typeof callback !== 'function') {
      throw new Error('A callback function is required');
    }

    this.#inOrder(this.root, callback);
  }

  #inOrder(node, callback) {
    if (node === null) return;

    this.#inOrder(node.left, callback);
    callback(node.data);
    this.#inOrder(node.right, callback);
  }

  // Root → Left → Right
  preOrderForEach(callback) {
    if (typeof callback !== 'function') {
      throw new Error('A callback function is required');
    }

    this.#preOrder(this.root, callback);
  }

  #preOrder(node, callback) {
    if (node === null) return;

    callback(node.data);
    this.#preOrder(node.left, callback);
    this.#preOrder(node.right, callback);
  }

  // Left → Right → Root
  postOrderForEach(callback) {
    if (typeof callback !== 'function') {
      throw new Error('A callback function is required');
    }

    this.#postOrder(this.root, callback);
  }

  #postOrder(node, callback) {
    if (node === null) return;

    this.#postOrder(node.left, callback);
    this.#postOrder(node.right, callback);
    callback(node.data);
  }

  // Returns the height (edges to deepest leaf) of the node containing value.
  // Returns undefined if value is not found.
  height(value) {
    const node = this.#findNode(this.root, value);
    if (node === null) return undefined;

    return this.#nodeHeight(node);
  }

  #findNode(node, value) {
    if (node === null) return null;
    if (value === node.data) return node;

    if (value < node.data) return this.#findNode(node.left, value);
    return this.#findNode(node.right, value);
  }

  // Computes the height of a given node (number of edges to deepest leaf)
  #nodeHeight(node) {
    if (node === null) return -1;

    const leftHeight = this.#nodeHeight(node.left);
    const rightHeight = this.#nodeHeight(node.right);

    return 1 + Math.max(leftHeight, rightHeight);
  }

  // Returns the depth (edges from root to node) of the node containing value.
  // Returns undefined if value is not found.
  depth(value) {
    let current = this.root;
    let edges = 0;

    while (current !== null) {
      if (value === current.data) return edges;

      if (value < current.data) {
        current = current.left;
      } else {
        current = current.right;
      }
      edges++;
    }

    return undefined;
  }

  // Returns true if the tree is balanced (every node's subtree heights differ by at most 1)
  isBalanced() {
    return this.#checkBalance(this.root) !== -1;
  }

  // Returns the height of node if balanced, or -1 if any subtree is unbalanced
  #checkBalance(node) {
    if (node === null) return 0;

    const left = this.#checkBalance(node.left);
    if (left === -1) return -1;

    const right = this.#checkBalance(node.right);
    if (right === -1) return -1;

    if (Math.abs(left - right) > 1) return -1;

    return 1 + Math.max(left, right);
  }

  // Rebuilds the tree into a balanced BST from the current values
  rebalance() {
    const values = [];
    this.inOrderForEach((value) => values.push(value));
    this.root = this.#buildTree(values);
  }

  // Visual console output of the tree structure
  prettyPrint(node = this.root, prefix = '', isLeft = true) {
    if (node === null || node === undefined) return;

    this.prettyPrint(node.right, `${prefix}${isLeft ? '│   ' : '    '}`, false);
    console.log(`${prefix}${isLeft ? '└── ' : '┌── '}${node.data}`);
    this.prettyPrint(node.left, `${prefix}${isLeft ? '    ' : '│   '}`, true);
  }
}

// ─────────────────────── Driver Script ───────────────────────

function randomArray(size) {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100));
}

function collectTraversal(tree, methodName) {
  const values = [];
  tree[methodName]((v) => values.push(v));
  return values;
}

function printAllOrders(tree) {
  console.log('Level order:', collectTraversal(tree, 'levelOrderForEach').join(', '));
  console.log('Pre order:  ', collectTraversal(tree, 'preOrderForEach').join(', '));
  console.log('In order:   ', collectTraversal(tree, 'inOrderForEach').join(', '));
  console.log('Post order: ', collectTraversal(tree, 'postOrderForEach').join(', '));
}

// 1. Create a BST from random numbers < 100
const data = randomArray(15);
console.log('Input array:', data.join(', '));
const tree = new Tree(data);

console.log('\n── Initial tree ──');
tree.prettyPrint();

// 2. Confirm balanced
console.log('\nIs balanced:', tree.isBalanced()); // true

// 3. Print all traversal orders
console.log('');
printAllOrders(tree);

// 4. Unbalance the tree by inserting numbers > 100
const bigNumbers = [150, 200, 250, 300, 350, 400];
bigNumbers.forEach((n) => tree.insert(n));

console.log('\n── After inserting', bigNumbers.join(', '), '──');
tree.prettyPrint();

// 5. Confirm unbalanced
console.log('\nIs balanced:', tree.isBalanced()); // false

// 6. Rebalance
tree.rebalance();

console.log('\n── After rebalance ──');
tree.prettyPrint();

// 7. Confirm balanced again
console.log('\nIs balanced:', tree.isBalanced()); // true

// 8. Print all traversal orders again
console.log('');
printAllOrders(tree);

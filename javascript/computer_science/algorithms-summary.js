// ----------------------------------------------------------
// 1. BÚSQUEDA BINARIA (Binary Search)
//    Array ordenado. O(log n)
// ----------------------------------------------------------

function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1; // no encontrado
}

// Ejemplo:
// binarySearch([1, 3, 5, 7, 9, 11], 7)  →  3
// binarySearch([1, 3, 5, 7, 9, 11], 4)  → -1

// ----------------------------------------------------------
// 2. PILA (Stack) — LIFO
//    Se usa para DFS
// ----------------------------------------------------------

class Stack {
  constructor() {
    this.items = [];
  }

  push(item) {
    this.items.push(item);
  }

  pop() {
    if (this.isEmpty()) return null;
    return this.items.pop();
  }

  peek() {
    return this.isEmpty() ? null : this.items[this.items.length - 1];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

// Ejemplo:
// const stack = new Stack();
// stack.push(1); stack.push(2); stack.push(3);
// stack.pop()  → 3
// stack.pop()  → 2
// stack.peek() → 1

// ----------------------------------------------------------
// 3. COLA (Queue) — FIFO
//    Se usa para BFS
// ----------------------------------------------------------

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }

  front() {
    return this.isEmpty() ? null : this.items[0];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }
}

// Ejemplo:
// const queue = new Queue();
// queue.enqueue(1); queue.enqueue(2); queue.enqueue(3);
// queue.dequeue() → 1
// queue.dequeue() → 2
// queue.front()  → 3

// ----------------------------------------------------------
// 4. ÁRBOL BINARIO DE BÚSQUEDA (Binary Search Tree)
//    Construido desde un array no ordenado
// ----------------------------------------------------------

class Node {
  constructor(data) {
    this.data = data;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  // Construir BST desde un array no ordenado
  buildFromArray(arr) {
    for (const value of arr) {
      this.insert(value);
    }
  }

  // Insertar un valor en el BST
  insert(data) {
    const node = new Node(data);

    if (!this.root) {
      this.root = node;
      return;
    }

    let current = this.root;
    while (true) {
      if (data < current.data) {
        if (!current.left) {
          current.left = node;
          return;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = node;
          return;
        }
        current = current.right;
      }
    }
  }

  // Buscar un valor
  find(data) {
    let current = this.root;

    while (current) {
      if (data === current.data) return current;
      current = data < current.data ? current.left : current.right;
    }

    return null;
  }

  // ----------------------------------------------------------
  // 5. BFS — Recorrido por niveles (usa cola)
  // ----------------------------------------------------------

  bfs() {
    const result = [];
    const queue = new Queue();

    if (!this.root) return result;

    queue.enqueue(this.root);

    while (!queue.isEmpty()) {
      const node = queue.dequeue();
      result.push(node.data);

      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
    }

    return result;
  }

  // ----------------------------------------------------------
  // 6. DFS — Recorrido en profundidad (3 variantes)
  // ----------------------------------------------------------

  // Preorder:  nodo → left → right
  dfsPreorder(node = this.root, result = []) {
    if (!node) return result;

    result.push(node.data);
    this.dfsPreorder(node.left, result);
    this.dfsPreorder(node.right, result);

    return result;
  }

  // Inorder:   left → nodo → right
  // (En un BST, devuelve los valores ORDENADOS)
  dfsInorder(node = this.root, result = []) {
    if (!node) return result;

    this.dfsInorder(node.left, result);
    result.push(node.data);
    this.dfsInorder(node.right, result);

    return result;
  }

  // Postorder: left → right → nodo
  dfsPostorder(node = this.root, result = []) {
    if (!node) return result;

    this.dfsPostorder(node.left, result);
    this.dfsPostorder(node.right, result);
    result.push(node.data);

    return result;
  }

  // DFS iterativo con Stack (preorder)
  dfsIterative() {
    const result = [];
    const stack = new Stack();

    if (!this.root) return result;

    stack.push(this.root);

    while (!stack.isEmpty()) {
      const node = stack.pop();
      result.push(node.data);

      // Push right first so left is processed first
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }

    return result;
  }

  // Altura del árbol
  height(node = this.root) {
    if (!node) return -1;

    const leftHeight = this.height(node.left);
    const rightHeight = this.height(node.right);

    return Math.max(leftHeight, rightHeight) + 1;
  }

  // Eliminar un nodo
  delete(data, node = this.root) {
    if (!node) return null;

    if (data < node.data) {
      node.left = this.delete(data, node.left);
    } else if (data > node.data) {
      node.right = this.delete(data, node.right);
    } else {
      // Caso 1: nodo hoja
      if (!node.left && !node.right) return null;

      // Caso 2: un solo hijo
      if (!node.left) return node.right;
      if (!node.right) return node.left;

      // Caso 3: dos hijos — encontrar el sucesor inorder
      let successor = node.right;
      while (successor.left) {
        successor = successor.left;
      }

      node.data = successor.data;
      node.right = this.delete(successor.data, node.right);
    }

    return node;
  }
}

// ----------------------------------------------------------
// EJEMPLO COMPLETO
// ----------------------------------------------------------

// const array = [8, 3, 10, 1, 6, 14, 4, 7, 13];
// const bst = new BST();
// bst.buildFromArray(array);
//
// Árbol resultante:
//         8
//        / \
//       3   10
//      / \    \
//     1   6    14
//        / \   /
//       4   7 13
//
// bst.bfs()           → [8, 3, 10, 1, 6, 14, 4, 7, 13]
// bst.dfsPreorder()   → [8, 3, 1, 6, 4, 7, 10, 14, 13]
// bst.dfsInorder()    → [1, 3, 4, 6, 7, 8, 10, 13, 14]  ← ¡ordenado!
// bst.dfsPostorder()  → [1, 4, 7, 6, 3, 13, 14, 10, 8]
// bst.dfsIterative()  → [8, 3, 1, 6, 4, 7, 10, 14, 13]
// bst.find(6)         → Node { data: 6, left: Node(4), right: Node(7) }
// bst.find(99)        → null

module.exports = { binarySearch, Stack, Queue, Node, BST };

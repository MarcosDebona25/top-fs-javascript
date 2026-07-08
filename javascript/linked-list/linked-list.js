class Node {
    constructor(value = null, nextNode = null) {
        this.value = value;
        this.nextNode = nextNode;
    }
}

class LinkedList {
    #headNode = null;

    append(value) {
        const newNode = new Node(value);

        if (this.#headNode === null) {
            this.#headNode = newNode;
            return;
        }

        let current = this.#headNode;
        while (current.nextNode !== null) {
            current = current.nextNode;
        }
        current.nextNode = newNode;
    }

    prepend(value) {
        const newNode = new Node(value, this.#headNode);
        this.#headNode = newNode;
    }

    size() {
        let count = 0;
        let current = this.#headNode;

        while (current !== null) {
            count++;
            current = current.nextNode;
        }

        return count;
    }

    head() {
        return this.#headNode?.value;
    }

    tail() {
        if (this.#headNode === null) return undefined;

        let current = this.#headNode;
        while (current.nextNode !== null) {
            current = current.nextNode;
        }

        return current.value;
    }

    at(index) {
        let current = this.#headNode;
        let i = 0;

        while (current !== null) {
            if (i === index) return current.value;
            current = current.nextNode;
            i++;
        }

        return undefined;
    }

    pop() {
        if (this.#headNode === null) return undefined;

        const value = this.#headNode.value;
        this.#headNode = this.#headNode.nextNode;
        return value;
    }

    contains(value) {
        let current = this.#headNode;

        while (current !== null) {
            if (current.value === value) return true;
            current = current.nextNode;
        }

        return false;
    }

    findIndex(value) {
        let current = this.#headNode;
        let index = 0;

        while (current !== null) {
            if (current.value === value) return index;
            current = current.nextNode;
            index++;
        }

        return -1;
    }

    toString() {
        if (this.#headNode === null) return "";

        let result = "";
        let current = this.#headNode;

        while (current !== null) {
            result += `( ${current.value} ) -> `;
            current = current.nextNode;
        }

        result += "null";
        return result;
    }

    insertAt(index, ...values) {
        const listSize = this.size();

        if (index < 0 || index > listSize) {
            throw new RangeError(
                `Index ${index} is out of bounds for list of size ${listSize}`
            );
        }

        if (values.length === 0) return;

        // Build a mini-chain from the provided values.
        const firstNew = new Node(values[0]);
        let lastNew = firstNew;

        for (let i = 1; i < values.length; i++) {
            lastNew.nextNode = new Node(values[i]);
            lastNew = lastNew.nextNode;
        }

        if (index === 0) {
            lastNew.nextNode = this.#headNode;
            this.#headNode = firstNew;
            return;
        }

        // For any other index, we find the predecessor node (at index - 1)
        // and splice the new chain between it and its current nextNode.
        let predecessor = this.#headNode;
        for (let i = 0; i < index - 1; i++) {
            predecessor = predecessor.nextNode;
        }

        lastNew.nextNode = predecessor.nextNode;
        predecessor.nextNode = firstNew;
    }

    removeAt(index) {
        const listSize = this.size();

        if (index < 0 || index >= listSize) {
            throw new RangeError(
                `Index ${index} is out of bounds for list of size ${listSize}`
            );
        }

        if (index === 0) {
            this.#headNode = this.#headNode.nextNode;
            return;
        }

        let predecessor = this.#headNode;
        for (let i = 0; i < index - 1; i++) {
            predecessor = predecessor.nextNode;
        }

        predecessor.nextNode = predecessor.nextNode.nextNode;
    }
}

module.exports = { Node, LinkedList };
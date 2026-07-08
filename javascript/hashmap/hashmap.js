class HashNode {
    constructor(key, value, nextNode = null) {
        this.key = key;
        this.value = value;
        this.nextNode = nextNode;
    }
}

class HashMap {
    #buckets;
    #size;
    #loadFactor;
    #capacity;

    constructor(loadFactor = 0.75, capacity = 16) {
        this.#loadFactor = loadFactor;
        this.#capacity = capacity;
        this.#size = 0;
        this.#buckets = new Array(this.#capacity).fill(null);
    }

    hash(key) {
        let hashCode = 0;
        const primeNumber = 31;

        for (let i = 0; i < key.length; i++) {
            hashCode = (primeNumber * hashCode + key.charCodeAt(i)) % this.#capacity;
        }

        return hashCode;
    }

    #checkBounds(index) {
        if (index < 0 || index >= this.#buckets.length) {
            throw new Error("Trying to access index out of bounds");
        }
    }

    set(key, value) {
        const index = this.hash(key);
        this.#checkBounds(index);

        let current = this.#buckets[index];

        // Walk the chain looking for an existing key to update.
        while (current !== null) {
            if (current.key === key) {
                current.value = value;
                return;
            }
            current = current.nextNode;
        }

        // Key not found — prepend a new node to the chain.
        const newNode = new HashNode(key, value, this.#buckets[index]);
        this.#buckets[index] = newNode;
        this.#size++;

        // Grow if load exceeds the threshold.
        if (this.#size / this.#capacity > this.#loadFactor) {
            this.#resize();
        }
    }

    get(key) {
        const index = this.hash(key);
        this.#checkBounds(index);

        let current = this.#buckets[index];

        while (current !== null) {
            if (current.key === key) return current.value;
            current = current.nextNode;
        }

        return null;
    }

    has(key) {
        const index = this.hash(key);
        this.#checkBounds(index);

        let current = this.#buckets[index];

        while (current !== null) {
            if (current.key === key) return true;
            current = current.nextNode;
        }

        return false;
    }

    remove(key) {
        const index = this.hash(key);
        this.#checkBounds(index);

        let current = this.#buckets[index];
        let previous = null;

        while (current !== null) {
            if (current.key === key) {
                if (previous === null) {
                    this.#buckets[index] = current.nextNode;
                } else {
                    previous.nextNode = current.nextNode;
                }
                this.#size--;
                return true;
            }
            previous = current;
            current = current.nextNode;
        }

        return false;
    }

    length() {
        return this.#size;
    }

    clear() {
        this.#buckets = new Array(this.#capacity).fill(null);
        this.#size = 0;
    }

    keys() {
        const result = [];

        for (const bucket of this.#buckets) {
            let current = bucket;
            while (current !== null) {
                result.push(current.key);
                current = current.nextNode;
            }
        }

        return result;
    }

    values() {
        const result = [];

        for (const bucket of this.#buckets) {
            let current = bucket;
            while (current !== null) {
                result.push(current.value);
                current = current.nextNode;
            }
        }

        return result;
    }

    entries() {
        const result = [];

        for (const bucket of this.#buckets) {
            let current = bucket;
            while (current !== null) {
                result.push([current.key, current.value]);
                current = current.nextNode;
            }
        }

        return result;
    }

    #resize() {
        const oldEntries = this.entries();

        this.#capacity *= 2;
        this.#buckets = new Array(this.#capacity).fill(null);
        this.#size = 0;

        for (const [key, value] of oldEntries) {
            this.set(key, value);
        }
    }
}

module.exports = { HashNode, HashMap };

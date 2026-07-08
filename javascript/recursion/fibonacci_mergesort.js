function fiboRecursive(n) {
    if (n <= 1) return n;
    return fiboRecursive(n - 1) + fiboRecursive(n - 2);
}

console.log(fiboRecursive(8));

function mergeSort(arr) {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));

    return merge(left, right);
}

function merge(left, right) {
    let result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    // Comparamos elementos de ambos arrays y los agregamos al resultado en orden
    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] < right[rightIndex]) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }

    // Agregamos los elementos restantes (si quedan)
    // Como los sub-arrays ya están ordenados, solo hay que "añadir lo que sobra"
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

console.log(mergeSort([3, 2, 1, 13, 8, 5, 0, 1]));
console.log(mergeSort([]));
console.log(mergeSort([105, 79, 100, 110]));
console.log(mergeSort([1, 2, 3, 4, 4, 3, 2, 1, 2, 3, 4, 5]));
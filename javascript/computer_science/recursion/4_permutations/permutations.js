const permutations = function (array, index = 0, results = []) {
  if (index === array.length) {
    results.push([...array]);
    return results;
  }

  for (let i = index; i < array.length; i++) {
    [array[index], array[i]] = [array[i], array[index]];
    permutations(array, index + 1, results);
    [array[index], array[i]] = [array[i], array[index]];
  }

  return results;
};

// Do not edit below this line
module.exports = permutations;

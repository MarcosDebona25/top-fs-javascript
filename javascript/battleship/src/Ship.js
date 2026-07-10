/**
 * Battleship — Ship factory.
 * (Cargar primero)
 */
window.Battleship = window.Battleship || {};

(function () {
  /**
   * Ship factory — creates a ship with positional awareness.
   * @param {number} length
   * @param {Array<[number,number]>} [coordinates=[]]
   * @returns {Ship}
   */
  function Ship(length, coordinates) {
    coordinates = coordinates || [];

    if (!Number.isInteger(length) || length < 1) {
      throw new Error("Ship length must be a positive integer, got " + length);
    }

    var hits = 0;
    var _coordinates = coordinates.map(function (c) {
      return [c[0], c[1]];
    });

    function hit() {
      if (hits < length) hits += 1;
      return hits;
    }

    function isSunk() {
      return hits >= length;
    }

    return Object.freeze({
      get length() {
        return length;
      },
      get hits() {
        return hits;
      },
      get coordinates() {
        return _coordinates.map(function (c) {
          return [c[0], c[1]];
        });
      },
      hit: hit,
      isSunk: isSunk,
    });
  }

  window.Battleship.Ship = Ship;
})();

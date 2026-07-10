/**
 * Battleship — Ship placement utility.
 * (Cargar cuarto)
 */
window.Battleship = window.Battleship || {};

(function () {
  var Ship = window.Battleship.Ship;

  var FLEET = [
    ["Carrier", 5],
    ["Battleship", 4],
    ["Cruiser", 3],
    ["Submarine", 3],
    ["Destroyer", 2],
  ];

  var SHIP_IMAGES = {
    Carrier: "imgs/Aircraft_Carrier-removebg-preview.png",
    Battleship: "imgs/Battleship-removebg-preview.png",
    Cruiser: "imgs/Cruiser-removebg-preview.png",
    Submarine: "imgs/Submarine-removebg-preview.png",
    Destroyer: "imgs/Destroyer-removebg-preview.png",
  };

  function placeShipRandomly(board, name, length, maxAttempts) {
    maxAttempts = maxAttempts || 200;
    var size = board.size;
    var ship = Ship(length);

    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      var horizontal = Math.random() < 0.5;
      var row = Math.floor(Math.random() * size);
      var col = Math.floor(Math.random() * size);

      var coordinates = [];
      for (var i = 0; i < length; i++) {
        var r = horizontal ? row : row + i;
        var c = horizontal ? col + i : col;
        coordinates.push([r, c]);
      }

      var inBounds = coordinates.every(function (c) {
        return c[0] >= 0 && c[0] < size && c[1] >= 0 && c[1] < size;
      });

      if (!inBounds) continue;

      try {
        board.placeShip(ship, coordinates);
        return { ship: ship, coordinates: coordinates, name: name };
      } catch (e) {
        // overlap — retry
      }
    }

    throw new Error(
      "Could not place " + name + " (length " + length + ") after " + maxAttempts + " attempts",
    );
  }

  function placeFleetRandomly(board) {
    return FLEET.map(function (item) {
      return placeShipRandomly(board, item[0], item[1]);
    });
  }

  window.Battleship.FLEET = FLEET;
  window.Battleship.SHIP_IMAGES = SHIP_IMAGES;
  window.Battleship.placeShipRandomly = placeShipRandomly;
  window.Battleship.placeFleetRandomly = placeFleetRandomly;
})();

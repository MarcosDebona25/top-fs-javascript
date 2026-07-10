/**
 * Battleship — Player factory.
 * (Cargar tercero)
 */
window.Battleship = window.Battleship || {};

(function () {
  var Gameboard = window.Battleship.Gameboard;

  function Player(name, type) {
    type = type || "human";
    if (type !== "human" && type !== "computer") {
      throw new Error("Invalid player type: " + type + ". Must be 'human' or 'computer'.");
    }

    var _gameboard = Gameboard();
    var _triedCoords = {};

    function makeRandomAttack(enemyBoard) {
      var size = enemyBoard.size;
      var available = [];

      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          var key = r + "," + c;
          if (!_triedCoords[key]) {
            available.push([r, c]);
          }
        }
      }

      if (available.length === 0) {
        throw new Error("No available coordinates to attack");
      }

      var idx = Math.floor(Math.random() * available.length);
      var r = available[idx][0];
      var c = available[idx][1];
      _triedCoords[r + "," + c] = true;

      return enemyBoard.receiveAttack([r, c]);
    }

    function resetAttacks() {
      _triedCoords = {};
    }

    return Object.freeze({
      get name() {
        return name;
      },
      get type() {
        return type;
      },
      get gameboard() {
        return _gameboard;
      },
      makeRandomAttack: makeRandomAttack,
      resetAttacks: resetAttacks,
    });
  }

  window.Battleship.Player = Player;
})();

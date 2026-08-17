/**
 * Battleship — Gameboard factory.
 * (Cargar segundo)
 */
window.Battleship = window.Battleship || {};

(function () {
  var Ship = window.Battleship.Ship;
  var SIZE = 10;

  function Gameboard() {
    var _grid = [];
    for (var r = 0; r < SIZE; r++) {
      _grid[r] = [];
      for (var c = 0; c < SIZE; c++) {
        _grid[r][c] = null;
      }
    }
    var _ships = [];
    var _missedAttacks = [];
    var _attackedCoords = {};
    var _hitCoords = {};

    function placeShip(ship, coordinates, name) {
      if (!Array.isArray(coordinates) || coordinates.length !== ship.length) {
        throw new Error(
          "Expected " + ship.length + " coordinates, got " + (coordinates ? coordinates.length : 0),
        );
      }

      var inBounds = coordinates.every(function (c) {
        return c[0] >= 0 && c[0] < SIZE && c[1] >= 0 && c[1] < SIZE;
      });
      if (!inBounds) throw new Error("Coordinates out of bounds (0-9)");

      var overlaps = coordinates.some(function (c) {
        return _grid[c[0]][c[1]] !== null;
      });
      if (overlaps) throw new Error("Ship overlaps with an existing ship");

      coordinates.forEach(function (c) {
        _grid[c[0]][c[1]] = ship;
      });

      _ships.push({
        ship: ship,
        name: name || null,
        coordinates: coordinates.map(function (c) {
          return [c[0], c[1]];
        }),
      });
    }

    function receiveAttack(coord) {
      var r = coord[0];
      var c = coord[1];

      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        throw new Error("Coordinate [" + r + "," + c + "] out of bounds (0-9)");
      }

      var key = r + "," + c;
      if (_attackedCoords[key]) {
        throw new Error("[" + r + "," + c + "] was already attacked");
      }
      _attackedCoords[key] = true;

      var targetShip = _grid[r][c];
      if (targetShip !== null) {
        targetShip.hit();
        _hitCoords[key] = true;
        var sunk = targetShip.isSunk();
        return { hit: true, sunk: sunk, ship: targetShip, coord: [r, c] };
      }

      _missedAttacks.push([r, c]);
      return { hit: false, sunk: false, ship: null, coord: [r, c] };
    }

    function getMissedAttacks() {
      return _missedAttacks.map(function (c) {
        return [c[0], c[1]];
      });
    }

    function areAllShipsSunk() {
      return _ships.length > 0 && _ships.every(function (entry) {
        return entry.ship.isSunk();
      });
    }

    function getShipEntries() {
      return _ships.map(function (entry) {
        return {
          ship: entry.ship,
          name: entry.name,
          coordinates: entry.coordinates.map(function (c) {
            return [c[0], c[1]];
          }),
        };
      });
    }

    function getShipName(ship) {
      for (var i = 0; i < _ships.length; i++) {
        if (_ships[i].ship === ship) return _ships[i].name || null;
      }
      return null;
    }

    function getGrid() {
      return _grid.map(function (row) {
        return row.slice();
      });
    }

    function wasCellAttacked(row, col) {
      return !!_attackedCoords[row + "," + col];
    }

    function wasCellHit(row, col) {
      return !!_hitCoords[row + "," + col];
    }

    function reset() {
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          _grid[r][c] = null;
        }
      }
      _ships.length = 0;
      _missedAttacks.length = 0;
      _attackedCoords = {};
      _hitCoords = {};
    }

    function removeShip(ship) {
      // Remove ship from grid cells
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (_grid[r][c] === ship) _grid[r][c] = null;
        }
      }
      // Remove from ships array
      for (var i = _ships.length - 1; i >= 0; i--) {
        if (_ships[i].ship === ship) {
          _ships.splice(i, 1);
          break;
        }
      }
    }

    return Object.freeze({
      get size() {
        return SIZE;
      },
      placeShip: placeShip,
      receiveAttack: receiveAttack,
      getMissedAttacks: getMissedAttacks,
      areAllShipsSunk: areAllShipsSunk,
      getShipEntries: getShipEntries,
      getShipName: getShipName,
      getGrid: getGrid,
      wasCellAttacked: wasCellAttacked,
      wasCellHit: wasCellHit,
      reset: reset,
      removeShip: removeShip,
    });
  }

  window.Battleship.Gameboard = Gameboard;
})();

require("../Ship.js");
require("../Gameboard.js");

var Ship = Battleship.Ship;
var Gameboard = Battleship.Gameboard;

describe("Gameboard", function () {
  var board;
  beforeEach(function () {
    board = Gameboard();
  });

  describe("construction", function () {
    test("has a 10x10 grid", function () {
      expect(board.size).toBe(10);
    });

    test("starts with no ships sunk", function () {
      expect(board.areAllShipsSunk()).toBe(false);
    });

    test("starts with no missed attacks", function () {
      expect(board.getMissedAttacks()).toEqual([]);
    });
  });

  describe("placeShip()", function () {
    test("places a ship at valid horizontal coordinates", function () {
      var ship = Ship(3);
      var coords = [[0, 0], [0, 1], [0, 2]];
      expect(function () { board.placeShip(ship, coords); }).not.toThrow();
      var grid = board.getGrid();
      expect(grid[0][0]).toBe(ship);
      expect(grid[0][1]).toBe(ship);
      expect(grid[0][2]).toBe(ship);
      expect(grid[1][0]).toBeNull();
    });

    test("places a ship at valid vertical coordinates", function () {
      var ship = Ship(2);
      board.placeShip(ship, [[5, 5], [6, 5]]);
      var grid = board.getGrid();
      expect(grid[5][5]).toBe(ship);
      expect(grid[6][5]).toBe(ship);
    });

    test("throws when coordinates length != ship length", function () {
      var ship = Ship(3);
      expect(function () { board.placeShip(ship, [[0, 0], [0, 1]]); }).toThrow();
      expect(function () { board.placeShip(ship, [[0, 0], [0, 1], [0, 2], [0, 3]]); }).toThrow();
    });

    test("throws when coordinates are out of bounds", function () {
      var ship = Ship(2);
      expect(function () { board.placeShip(ship, [[-1, 0], [0, 0]]); }).toThrow(/out of bounds/);
      expect(function () { board.placeShip(ship, [[0, 9], [0, 10]]); }).toThrow(/out of bounds/);
    });

    test("throws when ships overlap", function () {
      var shipA = Ship(3);
      var shipB = Ship(2);
      board.placeShip(shipA, [[0, 0], [0, 1], [0, 2]]);
      expect(function () { board.placeShip(shipB, [[0, 1], [0, 2]]); }).toThrow(/overlaps/);
    });

    test("allows non-overlapping adjacent ships", function () {
      board.placeShip(Ship(2), [[0, 0], [0, 1]]);
      expect(function () { board.placeShip(Ship(2), [[0, 2], [0, 3]]); }).not.toThrow();
    });
  });

  describe("receiveAttack()", function () {
    var ship;
    beforeEach(function () {
      ship = Ship(3);
      board.placeShip(ship, [[3, 3], [3, 4], [3, 5]]);
    });

    test("reports a hit when attacking a ship coordinate", function () {
      var result = board.receiveAttack([3, 4]);
      expect(result.hit).toBe(true);
      expect(result.ship).toBe(ship);
      expect(ship.hits).toBe(1);
    });

    test("reports sunk when the last segment is hit", function () {
      board.receiveAttack([3, 3]);
      board.receiveAttack([3, 4]);
      var result = board.receiveAttack([3, 5]);
      expect(result.hit).toBe(true);
      expect(result.sunk).toBe(true);
    });

    test("reports a miss and records the coordinate", function () {
      var result = board.receiveAttack([0, 0]);
      expect(result.hit).toBe(false);
      expect(result.ship).toBeNull();
      expect(board.getMissedAttacks()).toContainEqual([0, 0]);
    });

    test("throws when attacking out of bounds", function () {
      expect(function () { board.receiveAttack([-1, 0]); }).toThrow(/out of bounds/);
      expect(function () { board.receiveAttack([0, 10]); }).toThrow(/out of bounds/);
    });

    test("throws when attacking the same coordinate twice", function () {
      board.receiveAttack([0, 0]);
      expect(function () { board.receiveAttack([0, 0]); }).toThrow(/already attacked/);
    });

    test("throws when attacking a hit coordinate again", function () {
      board.receiveAttack([3, 3]);
      expect(function () { board.receiveAttack([3, 3]); }).toThrow(/already attacked/);
    });
  });

  describe("areAllShipsSunk()", function () {
    test("returns false when some ships remain afloat", function () {
      var ship1 = Ship(2);
      var ship2 = Ship(1);
      board.placeShip(ship1, [[0, 0], [0, 1]]);
      board.placeShip(ship2, [[5, 5]]);
      board.receiveAttack([5, 5]);
      expect(board.areAllShipsSunk()).toBe(false);
    });

    test("returns true when all ships are sunk", function () {
      var ship = Ship(2);
      board.placeShip(ship, [[0, 0], [0, 1]]);
      board.receiveAttack([0, 0]);
      board.receiveAttack([0, 1]);
      expect(board.areAllShipsSunk()).toBe(true);
    });

    test("returns false when no ships are placed", function () {
      expect(board.areAllShipsSunk()).toBe(false);
    });
  });

  describe("getMissedAttacks()", function () {
    test("returns empty array initially", function () {
      expect(board.getMissedAttacks()).toEqual([]);
    });

    test("returns all missed coordinates in order", function () {
      board.receiveAttack([0, 0]);
      board.receiveAttack([1, 1]);
      board.receiveAttack([2, 2]);
      var misses = board.getMissedAttacks();
      expect(misses).toHaveLength(3);
      expect(misses).toContainEqual([0, 0]);
      expect(misses).toContainEqual([1, 1]);
      expect(misses).toContainEqual([2, 2]);
    });

    test("returns a defensive copy", function () {
      board.receiveAttack([0, 0]);
      var misses = board.getMissedAttacks();
      misses.push([9, 9]);
      expect(board.getMissedAttacks()).toHaveLength(1);
    });

    test("does not include hit coordinates", function () {
      var ship = Ship(1);
      board.placeShip(ship, [[0, 0]]);
      board.receiveAttack([0, 0]);
      board.receiveAttack([1, 1]);
      expect(board.getMissedAttacks()).toEqual([[1, 1]]);
    });
  });

  describe("getShipEntries()", function () {
    test("returns placed ships with their coordinates", function () {
      var ship = Ship(2);
      var coords = [[7, 7], [7, 8]];
      board.placeShip(ship, coords);
      var entries = board.getShipEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].ship).toBe(ship);
      expect(entries[0].coordinates).toEqual(coords);
    });
  });

  describe("wasCellAttacked() and wasCellHit()", function () {
    test("returns false for untouched cells", function () {
      expect(board.wasCellAttacked(0, 0)).toBe(false);
      expect(board.wasCellHit(0, 0)).toBe(false);
    });

    test("wasCellAttacked returns true after a miss", function () {
      board.receiveAttack([3, 3]);
      expect(board.wasCellAttacked(3, 3)).toBe(true);
      expect(board.wasCellHit(3, 3)).toBe(false);
    });

    test("wasCellHit returns true after hitting a ship", function () {
      var ship = Ship(2);
      board.placeShip(ship, [[5, 5], [5, 6]]);
      board.receiveAttack([5, 5]);
      expect(board.wasCellAttacked(5, 5)).toBe(true);
      expect(board.wasCellHit(5, 5)).toBe(true);
      expect(board.wasCellAttacked(5, 6)).toBe(false);
    });
  });
});

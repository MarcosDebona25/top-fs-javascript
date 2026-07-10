require("../Ship.js");

var Ship = Battleship.Ship;

describe("Ship", function () {
  describe("construction", function () {
    test("creates a ship with the given length", function () {
      var ship = Ship(4);
      expect(ship.length).toBe(4);
    });

    test("throws if length is not a positive integer", function () {
      expect(function () { Ship(0); }).toThrow();
      expect(function () { Ship(-1); }).toThrow();
      expect(function () { Ship(2.5); }).toThrow();
      expect(function () { Ship("3"); }).toThrow();
    });

    test("starts with zero hits", function () {
      var ship = Ship(3);
      expect(ship.hits).toBe(0);
    });

    test("is not sunk initially", function () {
      var ship = Ship(3);
      expect(ship.isSunk()).toBe(false);
    });

    test("stores optional coordinates", function () {
      var coords = [[0, 0], [0, 1], [0, 2]];
      var ship = Ship(3, coords);
      expect(ship.coordinates).toEqual(coords);
      coords[0][0] = 99;
      expect(ship.coordinates[0][0]).toBe(0);
    });
  });

  describe("hit()", function () {
    test("increments hits by 1 each call", function () {
      var ship = Ship(4);
      expect(ship.hit()).toBe(1);
      expect(ship.hit()).toBe(2);
      expect(ship.hits).toBe(2);
    });

    test("does not exceed length", function () {
      var ship = Ship(2);
      ship.hit(); ship.hit(); ship.hit();
      expect(ship.hits).toBe(2);
    });

    test("calling hit on a sunk ship does not increase hits", function () {
      var ship = Ship(1);
      ship.hit();
      expect(ship.isSunk()).toBe(true);
      ship.hit();
      expect(ship.hits).toBe(1);
    });
  });

  describe("isSunk()", function () {
    test("returns false when hits < length", function () {
      var ship = Ship(3);
      ship.hit(); ship.hit();
      expect(ship.isSunk()).toBe(false);
    });

    test("returns true when hits === length", function () {
      var ship = Ship(2);
      ship.hit(); ship.hit();
      expect(ship.isSunk()).toBe(true);
    });

    test("works for a ship of length 1", function () {
      var ship = Ship(1);
      expect(ship.isSunk()).toBe(false);
      ship.hit();
      expect(ship.isSunk()).toBe(true);
    });
  });

  describe("immutability", function () {
    test("public interface is frozen", function () {
      var ship = Ship(3);
      expect(Object.isFrozen(ship)).toBe(true);
    });

    test("coordinates copy is independent of internal state", function () {
      var ship = Ship(2, [[0, 1], [0, 2]]);
      var copy = ship.coordinates;
      copy.push([9, 9]);
      expect(ship.coordinates).toHaveLength(2);
    });
  });
});

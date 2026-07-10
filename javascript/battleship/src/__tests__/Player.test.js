require("../Ship.js");
require("../Gameboard.js");
require("../Player.js");

var Ship = Battleship.Ship;
var Player = Battleship.Player;

describe("Player", function () {
  describe("construction", function () {
    test("creates a human player by default", function () {
      var p = Player("Marco");
      expect(p.name).toBe("Marco");
      expect(p.type).toBe("human");
    });

    test("creates a computer player", function () {
      var p = Player("CPU", "computer");
      expect(p.name).toBe("CPU");
      expect(p.type).toBe("computer");
    });

    test("throws on invalid type", function () {
      expect(function () { Player("X", "alien"); }).toThrow(/Invalid player type/);
    });

    test("each player has its own gameboard", function () {
      var p1 = Player("A");
      var p2 = Player("B");
      expect(p1.gameboard).not.toBe(p2.gameboard);
      p1.gameboard.placeShip(Ship(1), [[0, 0]]);
      expect(function () { p2.gameboard.receiveAttack([0, 0]); }).not.toThrow();
    });
  });

  describe("makeRandomAttack()", function () {
    test("attacks a valid coordinate on the enemy board", function () {
      var cpu = Player("CPU", "computer");
      var enemy = Player("Human").gameboard;
      enemy.placeShip(Ship(3), [[0, 0], [0, 1], [0, 2]]);
      var result = cpu.makeRandomAttack(enemy);
      expect(result).toHaveProperty("hit");
      expect(result).toHaveProperty("coord");
      expect(result.coord).toHaveLength(2);
    });

    test("never attacks the same coordinate twice", function () {
      var cpu = Player("CPU", "computer");
      var enemy = Player("Human").gameboard;
      var attacked = {};
      for (var i = 0; i < 100; i++) {
        var result = cpu.makeRandomAttack(enemy);
        var key = result.coord[0] + "," + result.coord[1];
        expect(attacked[key]).toBeUndefined();
        attacked[key] = true;
      }
      expect(Object.keys(attacked).length).toBe(100);
    });

    test("throws when no coordinates are left", function () {
      var cpu = Player("CPU", "computer");
      var enemy = Player("Human").gameboard;
      for (var i = 0; i < 100; i++) { cpu.makeRandomAttack(enemy); }
      expect(function () { cpu.makeRandomAttack(enemy); }).toThrow(/No available coordinates/);
    });
  });

  describe("resetAttacks()", function () {
    test("clears tried coordinates for a new game", function () {
      var cpu = Player("CPU", "computer");
      var enemy1 = Player("Human").gameboard;
      cpu.makeRandomAttack(enemy1);
      cpu.makeRandomAttack(enemy1);
      cpu.resetAttacks();
      var enemy2 = Player("Human").gameboard;
      for (var i = 0; i < 100; i++) { cpu.makeRandomAttack(enemy2); }
      expect(function () { cpu.makeRandomAttack(enemy2); }).toThrow(/No available coordinates/);
    });
  });
});

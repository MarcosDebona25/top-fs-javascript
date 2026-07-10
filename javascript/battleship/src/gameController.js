/**
 * Battleship — GameController.
 * (Cargar quinto)
 */
window.Battleship = window.Battleship || {};

(function () {
  var Player = window.Battleship.Player;
  var placeFleetRandomly = window.Battleship.placeFleetRandomly;

  var Phase = Object.freeze({
    PLACEMENT: "placement",
    PLAYING: "playing",
    GAME_OVER: "game_over",
  });

  function GameController() {
    var _human = null;
    var _computer = null;
    var _phase = Phase.PLACEMENT;
    var _currentAttacker = null;
    var _winner = null;
    var _message = "";
    var _listeners = [];

    function _notify(event, data) {
      data = data || {};
      data.phase = _phase;
      _listeners.forEach(function (fn) {
        fn(event, data);
      });
    }

    function subscribe(listener) {
      _listeners.push(listener);
    }

    function newGame() {
      _human = Player("Almirante", "human");
      _computer = Player("CPU", "computer");
      placeFleetRandomly(_computer.gameboard);
      _phase = Phase.PLACEMENT;
      _currentAttacker = null;
      _winner = null;
      _message = "Arrastra tus barcos al tablero o usa 'Aleatorio'";

      _notify("state-changed", {});
      _notify("phase-changed", { phase: _phase });
    }

    function placeHumanShip(ship, coordinates) {
      _human.gameboard.placeShip(ship, coordinates);
    }

    function removeHumanShip(ship) {
      _human.gameboard.removeShip(ship);
    }

    function isHumanFleetComplete() {
      var entries = _human.gameboard.getShipEntries();
      var fleet = window.Battleship.FLEET;
      return entries.length === fleet.length;
    }

    function startGame() {
      if (!isHumanFleetComplete()) return false;
      _phase = Phase.PLAYING;
      _currentAttacker = _human;
      _message = "Tu turno. Ataca una celda del tablero enemigo.";
      _notify("state-changed", {});
      _notify("phase-changed", { phase: _phase });
      return true;
    }

    function randomizeHumanFleet() {
      if (_phase !== Phase.PLACEMENT) return;

      _human.gameboard.reset();
      placeFleetRandomly(_human.gameboard);
      startGame();
    }

    function humanAttack(row, col) {
      if (_phase !== Phase.PLAYING) {
        return { valid: false, message: "El juego no esta en curso." };
      }
      if (_currentAttacker !== _human) {
        return { valid: false, message: "No es tu turno." };
      }

      var result;
      try {
        result = _computer.gameboard.receiveAttack([row, col]);
      } catch (e) {
        return { valid: false, message: e.message };
      }

      var shipName = _getShipName(result.ship);

      _message = result.hit
        ? result.sunk
          ? "HUNDIDO! Destruiste el " + shipName + " enemigo."
          : "Impacto en el " + shipName + "!"
        : "Agua... fallaste.";

      _notify("attack-result", {
        hit: result.hit,
        sunk: result.sunk,
        ship: result.ship,
        coord: result.coord,
        attacker: "human",
        shipName: shipName,
      });

      if (_computer.gameboard.areAllShipsSunk()) {
        _winner = _human;
        _phase = Phase.GAME_OVER;
        _message = "VICTORIA! Hundiste toda la flota enemiga.";
        _notify("game-over", { winner: _human });
        _notify("phase-changed", { phase: _phase });
        return {
          hit: result.hit,
          sunk: result.sunk,
          ship: result.ship,
          coord: result.coord,
          valid: true,
          message: _message,
          gameOver: true,
        };
      }

      _currentAttacker = _computer;
      _message += " La CPU esta atacando...";
      _notify("state-changed", {});

      return {
        hit: result.hit,
        sunk: result.sunk,
        ship: result.ship,
        coord: result.coord,
        valid: true,
        message: _message,
        gameOver: false,
      };
    }

    function computerAttack() {
      if (_currentAttacker !== _computer) {
        return { valid: false, message: "No es el turno de la CPU." };
      }

      var result;
      try {
        result = _computer.makeRandomAttack(_human.gameboard);
      } catch (e) {
        return { valid: false, message: e.message };
      }

      var shipName = _getShipName(result.ship);

      _message = result.hit
        ? result.sunk
          ? "La CPU hundio tu " + shipName + "!"
          : "La CPU impacto tu " + shipName + "."
        : "La CPU fallo el ataque.";

      _notify("attack-result", {
        hit: result.hit,
        sunk: result.sunk,
        ship: result.ship,
        coord: result.coord,
        attacker: "computer",
        shipName: shipName,
      });

      if (_human.gameboard.areAllShipsSunk()) {
        _winner = _computer;
        _phase = Phase.GAME_OVER;
        _message = "DERROTA. La CPU hundio toda tu flota.";
        _notify("game-over", { winner: _computer });
        _notify("phase-changed", { phase: _phase });
        return {
          hit: result.hit,
          sunk: result.sunk,
          ship: result.ship,
          coord: result.coord,
          valid: true,
          message: _message,
          gameOver: true,
        };
      }

      _currentAttacker = _human;
      _message += " Tu turno!";
      _notify("state-changed", {});

      return {
        hit: result.hit,
        sunk: result.sunk,
        ship: result.ship,
        coord: result.coord,
        valid: true,
        message: _message,
        gameOver: false,
      };
    }

    function _getShipName(ship) {
      if (!ship) return null;
      var map = { 5: "Portaaviones", 4: "Acorazado", 3: "Crucero/Submarino", 2: "Destructor" };
      return map[ship.length] || "Nave (" + ship.length + ")";
    }

    // --- Getters ---
    function getPhase() {
      return _phase;
    }
    function getMessage() {
      return _message;
    }
    function getWinner() {
      return _winner;
    }
    function getHuman() {
      return _human;
    }
    function getComputer() {
      return _computer;
    }
    function getCurrentAttacker() {
      return _currentAttacker;
    }

    return Object.freeze({
      subscribe: subscribe,
      newGame: newGame,
      placeHumanShip: placeHumanShip,
      removeHumanShip: removeHumanShip,
      isHumanFleetComplete: isHumanFleetComplete,
      startGame: startGame,
      randomizeHumanFleet: randomizeHumanFleet,
      humanAttack: humanAttack,
      computerAttack: computerAttack,
      getPhase: getPhase,
      getMessage: getMessage,
      getWinner: getWinner,
      getHuman: getHuman,
      getComputer: getComputer,
      getCurrentAttacker: getCurrentAttacker,
      Phase: Phase,
    });
  }

  window.Battleship.GameController = GameController;
  window.Battleship.Phase = Phase;
})();

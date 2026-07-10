/**
 * BATTLESHIP — Comando de Flota
 * Entry point (non-module).
 */
(function () {
  function main() {
    var game = window.Battleship.GameController();
    var dom = window.Battleship.DOMController();

    game.newGame();
    dom.init(game);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();

/**
 * Battleship — DOMController v3
 * Board-level drag-and-drop + ship image overlays on grid.
 */
window.Battleship = window.Battleship || {};

(function () {
  var _els = {};
  var _dragState = { shipLength: 0, shipName: "", orientation: "horizontal", dockElement: null };

  function DOMController() {
    function init(game) {
      _els.humanBoard      = document.getElementById("human-board");
      _els.computerBoard    = document.getElementById("computer-board");
      _els.messageBox       = document.getElementById("message");
      _els.randomizeBtn     = document.getElementById("btn-randomize");
      _els.restartBtn       = document.getElementById("btn-restart");
      _els.phaseBanner      = document.getElementById("phase-banner");
      _els.humanLegend      = document.getElementById("human-legend");
      _els.computerLegend   = document.getElementById("computer-legend");
      _els.computerOverlay  = document.getElementById("computer-overlay");
      _els.shipDock         = document.getElementById("ship-dock");
      _els.shipDockItems    = _els.shipDock.querySelector(".ship-dock__items");
      _els.startBtn         = document.getElementById("btn-start");
      _els.rotateBtn        = document.getElementById("btn-rotate");
      _els.placementMsg     = document.getElementById("placement-msg");

      /* Board-level drag & drop */
      _els.humanBoard.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        var cell = _cellFromPoint(e.clientX, e.clientY);
        _clearGhost();
        if (cell && !cell.classList.contains("cell--ship")) _paintGhost(cell);
      });
      _els.humanBoard.addEventListener("dragleave", function (e) {
        if (!_els.humanBoard.contains(e.relatedTarget)) _clearGhost();
      });
      _els.humanBoard.addEventListener("drop", function (e) {
        e.preventDefault(); _clearGhost();
        var cell = _cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        var r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
        if (isNaN(r) || isNaN(c)) return;
        _handleDrop(game, r, c);
      });

      /* Buttons */
      _els.rotateBtn.addEventListener("click", function () {
        _dragState.orientation = _dragState.orientation === "horizontal" ? "vertical" : "horizontal";
        _els.rotateBtn.textContent = "Girar (" + (_dragState.orientation === "horizontal" ? "H" : "V") + ")";
      });
      _els.randomizeBtn.addEventListener("click", function () { game.randomizeHumanFleet(); });
      _els.startBtn.addEventListener("click", function () {
        if (game.startGame()) return;
        alert("Coloca los 5 barcos en el tablero primero.");
      });
      _els.restartBtn.addEventListener("click", function () { game.newGame(); render(game); });

      game.subscribe(function (event, data) {
        if (event === "state-changed" || event === "phase-changed") render(game);
        if (event === "attack-result") { renderBoards(game); updateMessage(game); }
        if (event === "game-over") render(game);
      });

      render(game);
    }

    /* ================================================================
       RENDER
       ================================================================ */
    function render(game) {
      updatePhaseUI(game);
      renderBoards(game);
      updateMessage(game);
      renderLegends(game);
      renderShipDock(game);
      updateButtons(game);
    }

    function updatePhaseUI(game) {
      var p = game.getPhase();
      if (p === "placement") {
        _els.phaseBanner.textContent = "Coloca tu Flota";
        _els.phaseBanner.className = "phase-banner phase-banner--placement";
      } else if (p === "playing") {
        _els.phaseBanner.textContent = "En Combate";
        _els.phaseBanner.className = "phase-banner phase-banner--playing";
      } else {
        _els.phaseBanner.textContent = "Fin de la Partida";
        _els.phaseBanner.className = "phase-banner phase-banner--gameover";
      }
      _els.computerOverlay.hidden = p !== "placement";
      _els.shipDock.hidden = p !== "placement";
      _els.rotateBtn.hidden = p !== "placement";
      _els.placementMsg.hidden = p !== "placement";
      _els.computerBoard.classList.toggle("board--inactive", p !== "playing");
    }

    function renderBoards(game) {
      var h = game.getHuman(), c = game.getComputer();
      if (!h || !c) { _els.humanBoard.innerHTML = ""; _els.computerBoard.innerHTML = ""; return; }
      _renderBoard(_els.humanBoard, h.gameboard, { showShips: true, isHuman: true }, game);
      _renderBoard(_els.computerBoard, c.gameboard, { showShips: false, interactive: game.getPhase() === "playing" }, game);
      _renderShipImages(_els.humanBoard, h.gameboard);
    }

    /* Render cells */
    function _renderBoard(container, gameboard, options, game) {
      var size = gameboard.size;
      container.innerHTML = "";

      for (var r = 0; r < size; r++) {
        for (var c = 0; c < size; c++) {
          var cell = document.createElement("div");
          cell.className = "cell";
          cell.dataset.row = r;
          cell.dataset.col = c;

          var occupyingEntry = _findShipAt(gameboard, r, c);

          if (occupyingEntry && options.showShips) {
            cell.classList.add("cell--ship");
            if (options.isHuman && game.getPhase() === "placement") {
              cell.addEventListener("click", function () {
                if (game.getPhase() !== "placement") return;
                game.removeHumanShip(occupyingEntry.ship);
                render(game);
              });
              cell.title = "Clic para quitar";
            }
          }

          // Attacked state
          if (gameboard.wasCellAttacked(r, c)) {
            cell.classList.add("cell--attacked");
            if (gameboard.wasCellHit(r, c)) {
              cell.classList.add("cell--hit");
              if (occupyingEntry && occupyingEntry.ship.isSunk()) cell.classList.add("cell--sunk");
            } else {
              cell.classList.add("cell--miss");
            }
          }

          // Enemy attack handlers
          if (options.interactive && !gameboard.wasCellAttacked(r, c)) {
            cell.tabIndex = 0;
            cell.setAttribute("role", "button");
            cell.setAttribute("aria-label", "Atacar " + String.fromCharCode(65 + r) + (c + 1));
            cell.addEventListener("click", _attackHandler(game, r, c));
            cell.addEventListener("keydown", function (e) {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); _attackHandler(game, r, c)(); }
            });
          }

          container.appendChild(cell);
        }
      }
    }

    function _attackHandler(game, r, c) {
      return function () {
        if (game.getPhase() !== "playing") return;
        if (game.getCurrentAttacker() !== game.getHuman()) return;
        var result = game.humanAttack(r, c);
        if (result.valid && !result.gameOver) setTimeout(function () { game.computerAttack(); }, 1500);
      };
    }

    function _findShipAt(gameboard, r, c) {
      var entries = gameboard.getShipEntries();
      for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < entries[i].coordinates.length; j++) {
          if (entries[i].coordinates[j][0] === r && entries[i].coordinates[j][1] === c) return entries[i];
        }
      }
      return null;
    }

    /* ================================================================
       SHIP IMAGE OVERLAYS ON GRID
       ================================================================ */
    function _renderShipImages(container, gameboard) {
      // Remove old overlays
      var old = container.querySelectorAll(".board__ship-img");
      for (var i = 0; i < old.length; i++) old[i].remove();

      // Get actual cell dimensions from DOM
      var firstCell = container.querySelector(".cell");
      if (!firstCell) return;
      var cellRect = firstCell.getBoundingClientRect();
      var cellW = cellRect.width;
      var cellH = cellRect.height;
      // Calculate gap from the board's CSS
      var boardStyle = getComputedStyle(container);
      var gap = parseInt(boardStyle.gap) || 1;
      var borderW = parseInt(boardStyle.borderLeftWidth) || 2;
      var step = cellW + gap;

      var entries = gameboard.getShipEntries();
      var images = window.Battleship.SHIP_IMAGES;
      var nameMap = { 5: "Carrier", 4: "Battleship", 2: "Destroyer" };
      var threeCount = 0;

      for (var e = 0; e < entries.length; e++) {
        var entry = entries[e];
        var ship = entry.ship;
        var coords = entry.coordinates;
        if (!coords.length) continue;

        var len = ship.length;
        var shipName = entry.name;
        if (!shipName) {
          if (len === 3) {
            shipName = threeCount === 0 ? "Cruiser" : "Submarine";
            threeCount++;
          } else {
            shipName = nameMap[len] || "Ship";
          }
        }
        var imgSrc = images[shipName] || "";

        var minR = coords[0][0], maxR = coords[0][0];
        var minC = coords[0][1], maxC = coords[0][1];
        for (var k = 1; k < coords.length; k++) {
          if (coords[k][0] < minR) minR = coords[k][0];
          if (coords[k][0] > maxR) maxR = coords[k][0];
          if (coords[k][1] < minC) minC = coords[k][1];
          if (coords[k][1] > maxC) maxC = coords[k][1];
        }

        var isHorizontal = minR === maxR;

        var left = borderW + minC * step;
        var top  = borderW + minR * step;
        var w = isHorizontal ? (len * cellW + (len - 1) * gap) : cellW;
        var h = isHorizontal ? cellH : (len * cellH + (len - 1) * gap);

        var img = document.createElement("img");
        img.src = imgSrc;
        img.alt = shipName;
        img.className = "board__ship-img";
        if (ship.isSunk()) img.classList.add("board__ship-img--sunk");
        img.style.left = left + "px";
        img.style.top = top + "px";
        img.style.width = w + "px";
        img.style.height = h + "px";

        if (!isHorizontal) {
          // Rotate vertical: swap dimensions and rotate 90deg
          img.style.width = h + "px";
          img.style.height = w + "px";
          img.style.transformOrigin = "top left";
          img.style.transform = "rotate(90deg) translate(0, -100%)";
        } else {
          // Mirror the ship so the bow faces right (toward the enemy fleet)
          img.style.transform = "scaleX(-1)";
        }

        container.appendChild(img);
      }
    }

    /* ================================================================
       DRAG & DROP
       ================================================================ */
    function _cellFromPoint(x, y) {
      var cells = _els.humanBoard.querySelectorAll(".cell");
      for (var i = 0; i < cells.length; i++) {
        var rect = cells[i].getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return cells[i];
      }
      return null;
    }

    function _paintGhost(anchorCell) {
      if (!_dragState.shipLength) return;
      var row = parseInt(anchorCell.dataset.row), col = parseInt(anchorCell.dataset.col);
      if (isNaN(row) || isNaN(col)) return;
      for (var i = 0; i < _dragState.shipLength; i++) {
        var r = _dragState.orientation === "horizontal" ? row : row + i;
        var c = _dragState.orientation === "horizontal" ? col + i : col;
        if (r < 0 || r >= 10 || c < 0 || c >= 10) continue;
        var cell = _els.humanBoard.querySelector('[data-row="' + r + '"][data-col="' + c + '"]');
        if (cell && !cell.classList.contains("cell--ship")) cell.classList.add("cell--ghost");
      }
    }

    function _clearGhost() {
      var ghosts = _els.humanBoard.querySelectorAll(".cell--ghost");
      for (var i = 0; i < ghosts.length; i++) ghosts[i].classList.remove("cell--ghost");
    }

    function _handleDrop(game, row, col) {
      if (!_dragState.shipLength || !_dragState.shipName) return;
      var ship = window.Battleship.Ship(_dragState.shipLength);
      var coords = [];
      for (var i = 0; i < _dragState.shipLength; i++) {
        var r = _dragState.orientation === "horizontal" ? row : row + i;
        var c = _dragState.orientation === "horizontal" ? col + i : col;
        coords.push([r, c]);
      }
      for (var j = 0; j < coords.length; j++) {
        if (coords[j][0] < 0 || coords[j][0] >= 10 || coords[j][1] < 0 || coords[j][1] >= 10) {
          alert("El barco no entra en esa posicion."); return;
        }
      }
      try {
        game.placeHumanShip(ship, _dragState.shipName, coords);
        _dragState.shipLength = 0;
        render(game);
      } catch (err) {
        alert("No se puede colocar ahi: " + err.message);
      }
    }

    /* ================================================================
       SHIP DOCK
       ================================================================ */
    function renderShipDock(game) {
      if (game.getPhase() !== "placement") return;
      _els.shipDockItems.innerHTML = "";

      var fleet = window.Battleship.FLEET;
      var images = window.Battleship.SHIP_IMAGES;
      var entries = game.getHuman().gameboard.getShipEntries();
      var placedByLength = {};
      for (var i = 0; i < entries.length; i++) {
        var l = entries[i].ship.length;
        placedByLength[l] = (placedByLength[l] || 0) + 1;
      }
      var shownByLength = {};
      for (var fl = 0; fl < fleet.length; fl++) {
        var name = fleet[fl][0], len = fleet[fl][1];
        var total = fleet.filter(function (f) { return f[1] === len; }).length;
        var placed = placedByLength[len] || 0;
        var shown = shownByLength[len] || 0;
        if (placed + shown >= total) continue;
        shownByLength[len] = shown + 1;

        var imgSrc = images[name] || "";
        var item = document.createElement("div");
        item.className = "dock-item";
        item.draggable = true;
        item.dataset.length = len;
        item.dataset.name = name;
        item.innerHTML = '<img src="' + imgSrc + '" alt="' + name + '" class="dock-img" /><span class="dock-label">' + name + " (" + len + ")</span>";

        item.addEventListener("dragstart", function (e) {
          _dragState.shipLength = parseInt(this.dataset.length);
          _dragState.shipName = this.dataset.name;
          _dragState.dockElement = this;
          this.classList.add("dock-item--dragging");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", this.dataset.name);
        });
        item.addEventListener("dragend", function () { this.classList.remove("dock-item--dragging"); });

        _els.shipDockItems.appendChild(item);
      }
    }

    /* ================================================================
       MESSAGE, LEGENDS, BUTTONS
       ================================================================ */
    function updateMessage(game) {
      _els.messageBox.textContent = game.getMessage();
      _els.messageBox.className = "message message--info";
      if (game.getPhase() === "game_over") {
        _els.messageBox.classList.add(game.getWinner() === game.getHuman() ? "message--victory" : "message--defeat");
      }
    }

    function renderLegends(game) {
      var h = game.getHuman(), c = game.getComputer();
      if (!h || !c) return;
      _renderLegend(_els.humanLegend, h.gameboard);
      _renderLegend(_els.computerLegend, c.gameboard);
    }

    function _renderLegend(container, gameboard) {
      var entries = gameboard.getShipEntries();
      var info = [
        { name: "Portaaviones", key: "Carrier", len: 5, img: "imgs/Aircraft_Carrier-removebg-preview.png" },
        { name: "Acorazado", key: "Battleship", len: 4, img: "imgs/Battleship-removebg-preview.png" },
        { name: "Crucero", key: "Cruiser", len: 3, img: "imgs/Cruiser-removebg-preview.png" },
        { name: "Submarino", key: "Submarine", len: 3, img: "imgs/Submarine-removebg-preview.png" },
        { name: "Destructor", key: "Destroyer", len: 2, img: "imgs/Destroyer-removebg-preview.png" },
      ];
      var cards = [], used = {};
      for (var i = 0; i < info.length; i++) {
        for (var j = 0; j < entries.length; j++) {
          if (used[j]) continue;
          var entry = entries[j];
          var matches = entry.name ? entry.name === info[i].key : entry.ship.length === info[i].len;
          if (matches) {
            used[j] = true;
            cards.push({ name: info[i].name, img: info[i].img, entry: entry });
            break;
          }
        }
      }
      container.innerHTML = cards.map(function (crd) {
        return '<div class="legend-item' + (crd.entry.ship.isSunk() ? " legend-item--sunk" : "") + '">' +
          '<img src="' + crd.img + '" alt="' + crd.name + '" class="legend-img" />' +
          '<span class="legend-name">' + crd.name + '</span>' +
          '<span class="legend-status">' + (crd.entry.ship.isSunk() ? "Hundido" : "A flote") + '</span></div>';
      }).join("");
    }

    function updateButtons(game) {
      var p = game.getPhase();
      _els.randomizeBtn.hidden = p !== "placement";
      _els.startBtn.hidden = p !== "placement";
      _els.restartBtn.hidden = false;
      if (p === "placement") {
        var complete = game.isHumanFleetComplete();
        _els.startBtn.disabled = !complete;
        _els.startBtn.classList.toggle("btn--ready", complete);
      }
    }

    return Object.freeze({ init: init });
  }

  window.Battleship.DOMController = DOMController;
})();

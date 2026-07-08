const BOARD_SIZE = 8;

const KNIGHT_OFFSETS = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
];

function isValid(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function getKnightMoves(x, y) {
  return KNIGHT_OFFSETS.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) =>
    isValid(nx, ny)
  );
}

function knightMoves(start, end) {
  if (!isValid(start[0], start[1]) || !isValid(end[0], end[1])) {
    throw new Error("Positions must be within the 0-7 range.");
  }

  // Quick exit when start === end
  if (start[0] === end[0] && start[1] === end[1]) return [start];

  // BFS setup
  const visited = new Set();
  const queue = []; // each entry: { position, path }

  const key = (pos) => `${pos[0]},${pos[1]}`;

  visited.add(key(start));
  queue.push({ position: start, path: [start] });

  while (queue.length > 0) {
    const { position, path } = queue.shift();

    for (const next of getKnightMoves(position[0], position[1])) {
      if (next[0] === end[0] && next[1] === end[1]) {
        return [...path, next];
      }

      const k = key(next);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ position: next, path: [...path, next] });
      }
    }
  }

  // Should never reach here on a standard board
  return [];
}

// ── Console demo ──
function printPath(start, end) {
  const path = knightMoves(start, end);
  console.log(
    `=> You made it in ${path.length - 1} move${path.length - 1 !== 1 ? "s" : ""}! Here's your path:`
  );
  path.forEach((pos) => console.log(`  [${pos}]`));
  return path;
}

document.addEventListener("DOMContentLoaded", () => {
  const boardEl = document.getElementById("board");
  const resultEl = document.getElementById("result");
  const resetBtn = document.getElementById("reset-btn");
  const instructionEl = document.getElementById("instruction");

  let startPos = null;
  let endPos = null;
  let currentPath = [];
  let animating = false;

  // Build the 8×8 grid
  function createBoard() {
    boardEl.innerHTML = "";
    for (let row = 7; row >= 0; row--) {
      for (let col = 0; col < 8; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.classList.add((row + col) % 2 === 0 ? "dark" : "light");
        cell.dataset.x = col;
        cell.dataset.y = row;

        // Coordinate label
        const label = document.createElement("span");
        label.classList.add("coord-label");
        label.textContent = `${col},${row}`;
        cell.appendChild(label);

        cell.addEventListener("click", () => handleCellClick(col, row, cell));
        boardEl.appendChild(cell);
      }
    }
  }

  function handleCellClick(x, y, cell) {
    if (animating) return;

    if (!startPos) {
      startPos = [x, y];
      cell.classList.add("start");
      cell.innerHTML += '<span class="marker">♞</span>';
      instructionEl.textContent = "Select the destination square";
    } else if (!endPos) {
      if (x === startPos[0] && y === startPos[1]) return; // same square
      endPos = [x, y];
      cell.classList.add("end");
      cell.innerHTML += '<span class="marker target">⚑</span>';
      instructionEl.textContent = "Calculating path…";
      solvePath();
    }
  }

  async function solvePath() {
    animating = true;
    const path = knightMoves(startPos, endPos);
    currentPath = path;

    const moves = path.length - 1;
    resultEl.innerHTML = `You made it in <strong>${moves}</strong> move${moves !== 1 ? "s" : ""}!`;

    // Animate the path squares one by one (skip start & end)
    for (let i = 1; i < path.length - 1; i++) {
      await sleep(300);
      const [px, py] = path[i];
      const pathCell = getCell(px, py);
      if (pathCell) {
        pathCell.classList.add("path");
        pathCell.innerHTML += `<span class="step-number">${i}</span>`;
      }
    }

    // Show the full path list
    const pathList = path.map((p) => `[${p[0]},${p[1]}]`).join(" → ");
    resultEl.innerHTML += `<div class="path-list">${pathList}</div>`;

    instructionEl.textContent = "Done! Click Reset to try again.";
    animating = false;
  }

  function getCell(x, y) {
    return boardEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function reset() {
    startPos = null;
    endPos = null;
    currentPath = [];
    animating = false;
    resultEl.innerHTML = "";
    instructionEl.textContent = "Select the starting square";
    createBoard();
  }

  resetBtn.addEventListener("click", reset);
  createBoard();
});

const board = [" ", " ", " ", " ", " ", " ", " ", " ", " "];
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const gameState = {
    currentPlayer: "X",
    gameActive: false,
    players: { X: "Player X", O: "Player O" },
    score: { X: 0, O: 0 }
};

const playersDialog  = document.querySelector("#players-dialog");
const playersForm    = document.querySelector("#players-form");
const playerXInput   = document.querySelector("#player-x");
const playerOInput   = document.querySelector("#player-o");
const playerXLabel   = document.querySelector("#player-x-label");
const playerOLabel   = document.querySelector("#player-o-label");
const scoreX         = document.querySelector("#score-x");
const scoreO         = document.querySelector("#score-o");
const turnInfo       = document.querySelector("#turn-info");
const resetGameButton = document.querySelector("#reset-game");
const resetAllButton  = document.querySelector("#reset-all");
const cells          = [...document.querySelectorAll("#container .cell")];

const victoryDialog  = document.querySelector("#victory-dialog");
const victoryTitle   = document.querySelector("#victory-title");
const victoryMessage = document.querySelector("#victory-message");
const victoryNext    = document.querySelector("#victory-next");

function setTurnHoverClass() {
    document.body.classList.remove("turn-x", "turn-o");
    document.body.classList.add(gameState.currentPlayer === "X" ? "turn-x" : "turn-o");
}

function setTurnStateClass(className) {
    turnInfo.classList.remove("winner-x", "winner-o", "draw");
    if (className) turnInfo.classList.add(className);
}

function updatePlayersUI() {
    playerXLabel.textContent = `Player X: ${gameState.players.X}`;
    playerOLabel.textContent = `Player O: ${gameState.players.O}`;
    scoreX.textContent = `${gameState.players.X}: ${gameState.score.X}`;
    scoreO.textContent = `${gameState.players.O}: ${gameState.score.O}`;
}

function updateTurnUI(message, className) {
    setTurnStateClass(className);
    setTurnHoverClass();
    if (message) {
        turnInfo.textContent = message;
        return;
    }
    turnInfo.textContent = `Turn: ${gameState.players[gameState.currentPlayer]} (${gameState.currentPlayer})`;
}

function clearBoard() {
    for (let i = 0; i < board.length; i++) board[i] = "";
    cells.forEach((cell) => {
        cell.textContent = "";
        cell.disabled = false;
        cell.classList.remove("x-mark", "o-mark");
    });
}

function startGame() {
    gameState.currentPlayer = "X";
    gameState.gameActive = true;
    clearBoard();
    updatePlayersUI();
    updateTurnUI();
}

function getWinner() {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function endRound(message, className) {
    gameState.gameActive = false;
    cells.forEach((cell) => { cell.disabled = true; });
    updateTurnUI(message, className);
}

function showVictoryModal(title, message) {
    victoryTitle.textContent = title;
    victoryMessage.textContent = message;
    victoryDialog.showModal();
}

function handleCellClick(event) {
    const cell = event.currentTarget;
    const index = Number(cell.id);

    if (!gameState.gameActive || board[index]) return;

    board[index] = gameState.currentPlayer;
    cell.textContent = gameState.currentPlayer;
    cell.classList.add(gameState.currentPlayer === "X" ? "x-mark" : "o-mark");
    cell.disabled = true;

    const winner = getWinner();
    if (winner) {
        gameState.score[winner] += 1;
        updatePlayersUI();
        endRound(
            `Winner: ${gameState.players[winner]} (${winner})`,
            winner === "X" ? "winner-x" : "winner-o"
        );
        showVictoryModal(
            `${gameState.players[winner]} wins!`,
            `Score: ${gameState.players.X}: ${gameState.score.X} · ${gameState.players.O}: ${gameState.score.O}`
        );
        return;
    }

    if (!board.includes("")) {
        endRound("Draw!", "draw");
        showVictoryModal("Draw!", "Nobody wins this round.");
        return;
    }

    gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
    updateTurnUI();
}

function resetGame() {
    startGame();
}

function resetAll() {
    gameState.score.X = 0;
    gameState.score.O = 0;
    gameState.players.X = "Player X";
    gameState.players.O = "Player O";
    updatePlayersUI();
    updateTurnUI("Enter players to start");
    playerXInput.value = "";
    playerOInput.value = "";
    playersDialog.showModal();
}

playersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    gameState.players.X = playerXInput.value.trim();
    gameState.players.O = playerOInput.value.trim();
    playersDialog.close();
    startGame();
});

playersDialog.addEventListener("cancel", (event) => event.preventDefault());

victoryNext.addEventListener("click", () => {
    victoryDialog.close();
    startGame();
});

cells.forEach((cell) => cell.addEventListener("click", handleCellClick));
resetGameButton.addEventListener("click", resetGame);
resetAllButton.addEventListener("click", resetAll);

updatePlayersUI();
updateTurnUI("Enter players to start");
playersDialog.showModal();
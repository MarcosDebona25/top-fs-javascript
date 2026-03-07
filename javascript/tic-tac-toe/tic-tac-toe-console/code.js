function createUser(name, symbol) {
    const userName = (name && name.trim()) || `Player ${symbol}`;
    const getName = () => userName;

    return { userName, symbol, getName };
}

function createUsers() {
    const name1 = prompt("Player 1's name (X): ");
    const name2 = prompt("Player 2's name (O): ");

    const player1 = createUser(name1, "X");
    const player2 = createUser(name2, "O");

    return [player1, player2];
}

function printBoard() {
    console.log(`\n ${board[0]} | ${board[1]} | ${board[2]} `);
    console.log(`---|---|---`);
    console.log(` ${board[3]} | ${board[4]} | ${board[5]} `);
    console.log(`---|---|---`);
    console.log(` ${board[6]} | ${board[7]} | ${board[8]} \n`);
}

function playRound(playerName) {
    while (true) {
        const moveInput = prompt(`${playerName} (${currentPlayer}), enter your move (0-8): `);
        const move = Number.parseInt(moveInput, 10);

        if (!Number.isInteger(move) || move < 0 || move > 8) {
            console.log("Invalid input. Enter a whole number between 0 and 8.");
            continue;
        }

        if (!isCellAvailable(move)) {
            console.log("Cell already used. Pick another number between 0 and 8.");
            continue;
        }

        return move;
    }
}

function isCellAvailable(index) {
    return board[index] === " ";
}

function refreshBoard(number) {
    board[number] = currentPlayer;
}

function checkWin(playerName) {
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = board[winCondition[0]];
        let b = board[winCondition[1]];
        let c = board[winCondition[2]];

        if (a === " " || b === " " || c === " ") {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        console.log(`${playerName} (${currentPlayer}) has won!`);
        gameActive = false;
        return true;
    }

    if (!board.includes(" ")) {
        console.log("It's a draw!");
        gameActive = false;
        return true;
    }

    return false;
}

function playBoard() {
    const [player1, player2] = createUsers();
    const playerNameBySymbol = {
        X: player1.getName(),
        O: player2.getName()
    };

    console.log("================= GAME STARTS =================");
    console.log(`1. ${player1.getName()} is X, 2. ${player2.getName()} is O`);
    printBoard();

    while (gameActive) {
        const playerName = playerNameBySymbol[currentPlayer];
        const number = playRound(playerName);
        refreshBoard(number);
        printBoard();
        if (!checkWin(playerName)) {
            currentPlayer = currentPlayer === "X" ? "O" : "X";
        }
    }
}

const board = [" ", " ", " ", " ", " ", " ", " ", " ", " "];
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];
let currentPlayer = "X";
let gameActive = true;

playBoard();
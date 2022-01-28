"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 6969 });
// These must match the client
const COLUMNS = 27;
const ROWS = 20;
const FILLED_ROWS = 7;
let gameState = {};
const generateInitialGrid = () => {
    const grid = [];
    for (let i = 0; i < ROWS; i++) {
        if (i < FILLED_ROWS) {
            grid.push(Array(COLUMNS).fill(-1));
        }
        else if (i < ROWS - FILLED_ROWS) {
            grid.push(Array(COLUMNS).fill(0));
        }
        else {
            grid.push(Array(COLUMNS).fill(1));
        }
    }
    return grid;
};
const updateGrid = (position, player, ws) => {
    if (gameState.grid[position[1]][position[0]] === player) {
        // If we click on our piece, no matter what we are moving it
        gameState.grid[position[1]][position[0]] = 0;
        // We are always jumping over something
        if (position[1] - player >= 0 && position[1] - player < ROWS) {
            // If we are jumping over an enemy piece, remove it
            if (gameState.grid[position[1] - player][position[0]] === -player) {
                gameState.grid[position[1] - player][position[0]] = 0;
            }
        }
        // If we don't go off the end of the board
        if (position[1] - 2 * player >= 0 && position[1] - 2 * player < ROWS) {
            // If we land on an enemy, suicide also
            if (gameState.grid[position[1] - 2 * player][position[0]] === -player) {
                gameState.grid[position[1] - 2 * player][position[0]] = 0;
                // If we are jumping on a white
            }
            else if (gameState.grid[position[1] - 2 * player][position[0]] === player) {
                gameState.grid[position[1]][position[0]] = player;
                // errorDot.current = [position[0], position[1] - 2];
                // setTimeout(() => {
                //   errorDot.current = [-1, -1];
                // }, 100);
            }
            else {
                gameState.grid[position[1] - 2 * player][position[0]] = player;
            }
        }
        else {
            // alert("game over");
            if (player === -1) {
                ws.send(JSON.stringify({ type: "gameover", data: { message: "Black wins" } }));
            }
            else {
                ws.send(JSON.stringify({ type: "gameover", data: { message: "White wins" } }));
            }
        }
    }
    else if (gameState.grid[position[1]][position[0]] === 0) {
        if (gameState.grid[position[1]][position[0] - player] === player) {
            gameState.grid[position[1]][position[0] - player] = 0;
            gameState.grid[position[1]][position[0]] = player;
        }
        if (gameState.grid[position[1]][position[0] + player] === player) {
            gameState.grid[position[1]][position[0] + player] = 0;
            gameState.grid[position[1]][position[0]] = player;
        }
    }
};
wss.on("connection", function connection(ws) {
    gameState.grid = generateInitialGrid();
    console.log("started");
    ws.send(JSON.stringify({ type: "init", data: { gameState } }));
    ws.on("message", function message(data) {
        const message = JSON.parse(data.toString());
        console.log("from client", message);
        switch (message.type) {
            case "move":
                updateGrid(message.data.position, message.data.player, ws);
                ws.send(JSON.stringify({ type: "update", data: { gameState } }));
                break;
        }
    });
});
//# sourceMappingURL=server.js.map
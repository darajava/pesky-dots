import { WebSocketServer, WebSocket } from "ws";
import { Board, GameState, Position } from "common/dist/types";

const wss = new WebSocketServer({ port: 42069 });

// These must match the client
const COLUMNS = 27;
const ROWS = 20;
const FILLED_ROWS = 6;

let gameState: GameState = {};

const generateInitialGrid = () => {
  const grid: number[][] = [];
  for (let i = 0; i < ROWS; i++) {
    if (i < FILLED_ROWS) {
      grid.push(Array(COLUMNS).fill(-1));
    } else if (i < ROWS - FILLED_ROWS) {
      grid.push(Array(COLUMNS).fill(0));
    } else {
      grid.push(Array(COLUMNS).fill(1));
    }
  }

  return grid;
};

const updateGrid = (
  position: [number, number],
  player: number,
  ws: WebSocket
) => {
  const movedFrom: { position: Position | undefined; player: number }[] = [];
  const movedTo: { position: Position | undefined; player: number }[] = [];

  if (gameState.board[position[1]][position[0]] === player) {
    // If we click on our piece, no matter what we are moving it
    gameState.board[position[1]][position[0]] = 0;

    // If we don't go off the end of the board
    if (position[1] - 2 * player >= 0 && position[1] - 2 * player < ROWS) {
      // if (position[1] - 3 * player >= 0 && position[1] - 3 * player < ROWS) {
      //   if (
      //     gameState.board[position[1] - 3 * player][position[0]] === -player &&
      //     gameState.board[position[1] - 1 * player][position[0]] === -player
      //   ) {
      //     gameState.board[position[1]][position[0]] = 0;

      //     movedFrom.push({
      //       position: [position[0], position[1]],
      //       player: player,
      //     });
      //     movedTo.push(undefined);
      //     return [movedFrom, movedTo];
      //   }
      // }

      // We are always jumping over something
      if (position[1] - player >= 0 && position[1] - player < ROWS) {
        // If we are jumping over an enemy piece, remove it
        if (gameState.board[position[1] - player][position[0]] === -player) {
          gameState.board[position[1] - player][position[0]] = 0;

          movedFrom.push({
            position: [position[0], position[1] - player],
            player: -player,
          });
          movedTo.push(undefined);
        }
      }

      // If we land on an enemy, suicide also
      if (gameState.board[position[1] - 2 * player][position[0]] === -player) {
        gameState.board[position[1] - 2 * player][position[0]] = 0;

        movedFrom.push({
          position: [position[0], position[1]],
          player: player,
        });
        movedTo.push({
          position: [position[0], position[1] - 2 * player],
          player: player,
        });

        movedFrom.push({
          position: [position[0], position[1] - 2 * player],
          player: -player,
        });
        movedTo.push(undefined);
      } else if (
        // If we are jumping on a white
        gameState.board[position[1] - 2 * player][position[0]] === player
      ) {
        gameState.board[position[1]][position[0]] = player;

        // Highlight as the opposite colour (hack)
        movedFrom.push({
          position: [position[0], position[1] - 2 * player],
          player: -player,
        });
        movedTo.push(undefined);
        // errorDot.current = [position[0], position[1] - 2];
        // setTimeout(() => {
        //   errorDot.current = [-1, -1];
        // }, 100);
      } else {
        gameState.board[position[1] - 2 * player][position[0]] = player;

        movedFrom.push({ position: [position[0], position[1]], player });
        movedTo.push({
          position: [position[0], position[1] - 2 * player],
          player,
        });
      }
    } else {
      // alert("game over");
      if (player === -1) {
        ws.send(
          JSON.stringify({ type: "gameover", data: { message: "Black wins" } })
        );
      } else {
        ws.send(
          JSON.stringify({ type: "gameover", data: { message: "White wins" } })
        );
      }
    }
  } else if (gameState.board[position[1]][position[0]] === 0) {
    if (gameState.board[position[1]][position[0] - player] === player) {
      gameState.board[position[1]][position[0] - player] = 0;
      gameState.board[position[1]][position[0]] = player;

      movedFrom.push({ position: [position[0] - player, position[1]], player });
      movedTo.push({ position: [position[0], position[1]], player });
    }

    if (gameState.board[position[1]][position[0] + player] === player) {
      gameState.board[position[1]][position[0] + player] = 0;
      gameState.board[position[1]][position[0]] = player;

      movedFrom.push({ position: [position[0] + player, position[1]], player });
      movedTo.push({ position: [position[0], position[1]], player });
    }
  }

  return [movedFrom, movedTo];
};

const connections: { id: number; ws: WebSocket }[] = [];

wss.on("connection", function connection(ws) {
  gameState.board = generateInitialGrid();
  console.log("started");
  const id = Math.round(Math.random() * 1000000);

  connections.push({ ws, id });

  ws.send(JSON.stringify({ type: "init", data: { gameState } }));

  ws.on("message", function message(data) {
    const message = JSON.parse(data.toString());
    console.log("from client", message);

    switch (message.type) {
      case "move":
        const [movedFrom, movedTo] = updateGrid(
          message.data.position,
          message.data.player,
          ws
        );

        for (const connection of connections) {
          connection.ws.send(
            JSON.stringify({
              type: "update",
              data: { gameState, movedTo, movedFrom },
            })
          );
        }
    }
  });

  ws.on("close", () => {
    const i = connections.findIndex((connection) => {
      return connection.id === id;
    });

    connections.splice(i, 1);
  });
});

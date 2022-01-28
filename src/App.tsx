/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from "react";
import "./App.css";
import styles from "./styles.module.css";

//@ts-ignore
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

const WIDTH = 800;
const HEIGHT = 600;
const COLUMNS = 27;
const ROWS = 20;
const CELL_WIDTH = WIDTH / COLUMNS;
const CELL_HEIGHT = HEIGHT / ROWS;
const CELL_PADDING = 5;

const ws = new WebSocket("ws://localhost:6969");

function App() {
  const grid = useRef<number[][]>([]);
  const errorDot = useRef<[number, number]>([-1, -1]);
  const cursorPosition = useRef<[number, number]>([-100, -100]);
  const player = useRef(Math.random() < 0.5 ? -1 : 1);

  function init() {
    window.requestAnimationFrame(() => draw());
  }

  function flipGrid() {
    if (player.current === -1) {
      grid.current = grid.current.reverse();
    }
  }

  function flipPosition(position: [number, number]) {
    if (player.current === -1) {
      return [position[0], ROWS - position[1] - 1];
    }

    return position;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getGridAlignedCoordsFromMousePosition = (): [number, number] => {
    return [
      cursorPosition.current[0] - (cursorPosition.current[0] % CELL_WIDTH),
      cursorPosition.current[1] - (cursorPosition.current[1] % CELL_HEIGHT),
    ];
  };

  const getGridCoordsFromMousePosition = (): [number, number] => {
    const gridAligned = getGridAlignedCoordsFromMousePosition();

    return [
      Math.round(gridAligned[0] / CELL_WIDTH),
      Math.round(gridAligned[1] / CELL_HEIGHT),
    ];
  };

  const draw = (dontRecurse?: boolean) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.fillStyle = `#888`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `#707070`;

    const mouseCoords = getGridAlignedCoordsFromMousePosition();
    // @ts-ignore
    ctx.roundRect(...mouseCoords, CELL_WIDTH, CELL_HEIGHT, 5).fill();

    const gridMouseCoords = getGridCoordsFromMousePosition();
    grid.current.every((row, y) => {
      // console.log(row, y);
      row.every((cell, x) => {
        // console.log(cell);

        if (cell === -1 || cell === 1) {
          ctx.fillStyle = cell === 1 ? "#ccc" : `#333`;

          if (
            gridMouseCoords[0] === x &&
            gridMouseCoords[1] === y &&
            cell === 1
          ) {
            ctx.fillStyle = "#ddd";
          }

          if (errorDot.current[0] === x && errorDot.current[1] === y)
            ctx.fillStyle = "#e99696";

          ctx
            // @ts-ignore
            .roundRect(
              CELL_WIDTH * x + CELL_PADDING,
              CELL_HEIGHT * y + CELL_PADDING,
              CELL_WIDTH - CELL_PADDING * 2,
              CELL_HEIGHT - CELL_PADDING * 2,
              100
            )
            .fill();
        }
        return true;
      });
      return true;
    });

    if (!dontRecurse) window.requestAnimationFrame(() => draw());
  };

  useEffect(() => {
    ws.onopen = function open() {
      ws.send(JSON.stringify({ type: "hello", data: { one: 1 } }));
    };

    ws.onmessage = function message(data) {
      const message = JSON.parse(data.data);
      console.log("from ws", message);

      switch (message.type) {
        case "init":
          grid.current = message.data.gameState.grid;
          flipGrid();
          console.log(message.data.gameState);
          init();
          break;
        case "update":
          grid.current = message.data.gameState.grid;
          flipGrid();

          break;
        case "gameover":
          alert(message.data.message);

          break;
      }
    };
  });

  function getCursorPosition(
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y];
  }

  const makeMove = () => {
    const position = getGridCoordsFromMousePosition();
    ws.send(
      JSON.stringify({
        type: "move",
        data: { position: flipPosition(position), player: player.current },
      })
    );
  };

  return (
    <>
      <div className={styles.container}>
        <canvas
          onMouseDown={(e) => {
            // toValue.current = canvasRef.current!.height - e.clientY;
            makeMove();
          }}
          onMouseMove={(e) => {
            // toValue.current = canvasRef.current!.height - e.clientY;
            cursorPosition.current = getCursorPosition(e);
          }}
          width={WIDTH}
          height={HEIGHT}
          ref={canvasRef}
          className={styles.canvas}
        ></canvas>
      </div>
      <div className={styles.notSupported}>This game is not for mobile.</div>
    </>
  );
}

export default App;

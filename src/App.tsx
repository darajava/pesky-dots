/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from "react";
import "./App.css";
import styles from "./styles.module.css";
import { Board, GameState, Point, Position } from "common/dist/types";

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
const COLUMNS = 16;
const ROWS = 12;
const CELL_WIDTH = WIDTH / COLUMNS;
const CELL_HEIGHT = HEIGHT / ROWS;
const CELL_PADDING = 5;

const P1_COLOR = "#5ea4e3";
const P2_COLOR = "black";

const BACKGROUND_COLOR = "#f4f4f4";

const ws = new WebSocket(
  process.env.NODE_ENV === "development"
    ? "ws://localhost:42069"
    : "ws://192.241.254.136:42069"
);

type Animation = {
  from: Position;
  to?: Position;
  completeAmount: number;
  player: number;
};

function App() {
  const grid = useRef<number[][]>([]);
  const errorDot = useRef<[number, number]>([-1, -1]);
  const cursorPosition = useRef<[number, number]>([-100, -100]);
  const player = useRef(Math.random() < 0.5 ? -1 : 1);

  const animationList = useRef<Animation[]>([]);

  function init() {
    window.requestAnimationFrame(() => draw());
  }

  function flipGrid() {
    if (player.current === -1) {
      grid.current = grid.current.reverse();
    }
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= ROWS; x++) {
      ctx.beginPath(); // Start a new path
      ctx.moveTo(0, x * CELL_HEIGHT); // Move the pen to (30, 50)
      ctx.lineTo(WIDTH, x * CELL_HEIGHT); // Draw a line to (150, 100)
      ctx.stroke(); // Render the path
    }
    for (let y = 0; y <= COLUMNS; y++) {
      ctx.beginPath(); // Start a new path
      ctx.moveTo(y * CELL_WIDTH, 0); // Move the pen to (30, 50)
      ctx.lineTo(y * CELL_WIDTH, HEIGHT); // Draw a line to (150, 100)
      ctx.stroke(); // Render the path
    }
    ctx.restore();
  };

  function flipPosition(position: [number, number]): [number, number] {
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

  const isPositionInAnimationList = (position: Position) => {
    // console.log(position + ";sd;ds;d");
    return (
      animationList.current.findIndex((e) => {
        if (!e.to) return false;

        return e.to[0] === position[0] && e.to[1] === position[1];
      }) >= 0
    );
  };

  const getTween = (animation: Animation) => {
    if (!animation.to) {
      return;
    }

    const x =
      animation.from[0] +
      (animation.to[0] - animation.from[0]) * animation.completeAmount;
    const y =
      animation.from[1] +
      (animation.to[1] - animation.from[1]) * animation.completeAmount;

    const [x1, y1] = flipPosition([x, y]);

    return [CELL_WIDTH * x1 + CELL_PADDING, CELL_HEIGHT * y1 + CELL_PADDING];
  };

  const draw = (dontRecurse?: boolean) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    if (!grid.current) return;

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `#cccccc`;

    const mouseCoords = getGridAlignedCoordsFromMousePosition();
    // @ts-ignore
    ctx.roundRect(...mouseCoords, CELL_WIDTH, CELL_HEIGHT, 5).fill();
    drawGrid(ctx);

    const gridMouseCoords = getGridCoordsFromMousePosition();
    grid.current.every((row, y) => {
      // console.log(row, y);
      row.every((cell, x) => {
        // console.log(cell);

        if (isPositionInAnimationList(flipPosition([x, y]))) {
          return true;
        }

        if (cell === -1 || cell === 1) {
          ctx.fillStyle = cell === 1 ? P1_COLOR : P2_COLOR;
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

    for (let animation of animationList.current) {
      const [x, y] = flipPosition(animation.from);

      ctx.fillStyle = animation.player === 1 ? P1_COLOR : P2_COLOR;

      const tween = getTween(animation);
      if (tween) {
        ctx
          // @ts-ignore
          .roundRect(
            ...tween,
            CELL_WIDTH - CELL_PADDING * 2,
            CELL_HEIGHT - CELL_PADDING * 2,
            100
          )
          .fill();
      } else {
        ctx.save();
        ctx.globalAlpha = 1 - animation.completeAmount;

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

        ctx.restore();
      }
      animation.completeAmount += 0.2;
    }

    animationList.current = animationList.current.filter((e) => {
      return e.completeAmount < 1;
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
          grid.current = message.data.gameState.board;
          flipGrid();
          console.log(message.data.gameState);
          init();
          break;
        case "update":
          grid.current = message.data.gameState.board;
          for (let i = 0; i < message.data.movedFrom?.length; i++) {
            console.log(message.data.movedFrom[i].player + "@");
            animationList.current.push({
              from: message.data.movedFrom[i].position,
              to: message.data.movedTo[i]?.position,
              completeAmount: 0,
              player: message.data.movedFrom[i].player,
            });
          }

          console.log(animationList.current);
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
    console.log(position);
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

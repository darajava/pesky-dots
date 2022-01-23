/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import styles from "./styles.module.css";
import GameOver from "./GameOver";
import Play from "./Play";

function App() {
  function init() {
    window.requestAnimationFrame(draw);
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toValue = useRef(0);
  const currentValue = useRef(0);
  const currentCoords = useRef<number[][]>();
  const [distance, setDistance] = useState(0);
  const time = useRef(Date.now());
  const correctWeight = useRef(10);
  const [displayTime, setDisplayTime] = useState("");
  const pixelRadius = useRef(5);
  const toValueDelta = useRef(0);
  const backgroundPulseOpacity = useRef(0);

  const [dummy, setDummy] = useState(0);

  const playing = useRef(false);
  const gameOver = useRef(false);
  const neverClicked = useRef(true);

  const drawPixels = (coords: number[][], ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "white";
    for (const coord of coords) {
      ctx.fillRect(
        coord[0],
        coord[1],
        pixelRadius.current,
        pixelRadius.current
      );
    }
  };

  const getRandomPositions = () => {
    const NUM_COORDS = 5;
    const result = [];
    for (let i = 0; i < NUM_COORDS; i++) {
      result.push(getRandomPosition());
    }

    return result;
  };

  const getRandomPosition = () => {
    const width = canvasRef.current!.width;
    const height = canvasRef.current!.height;

    return [
      Math.random() * (width * 0.8) + width * 0.1,
      Math.random() * (height * 0.8) + height * 0.1,
    ].map(Math.round);
  };

  const draw = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!currentCoords.current) {
      currentCoords.current = getRandomPositions();
    }

    if (!ctx) return;

    ctx.clearRect(0, 0, 10000, 10000);
    const bgColor = 136 + backgroundPulseOpacity.current;
    ctx.fillStyle = `rgb(${bgColor}, ${bgColor}, ${bgColor})`;
    console.log(ctx.fillStyle);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!playing.current) {
      return;
    }

    if (neverClicked.current) {
      setDisplayTime("0");
    } else {
      setDisplayTime(
        ((new Date().getTime() - time.current) / 1000).toFixed(1) + ""
      );
    }

    drawPixels(currentCoords.current, ctx);

    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    if (gameOver.current) {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.fillRect(
      0,
      canvas.height - currentValue.current,
      canvas.width,
      canvas.height
    );

    toValue.current += toValueDelta.current;

    // ctx.fillRect(0, 0, 1000, 1000);
    if (currentValue !== toValue) {
      currentValue.current =
        currentValue.current + (toValue.current - currentValue.current) / 10;
    }

    if (!neverClicked.current) {
      pixelRadius.current -= 0.01;

      if (pixelRadius.current < 1) {
        pixelRadius.current = 1;
        toValueDelta.current += 0.0001;
        if (toValueDelta.current > 0.4) {
          toValueDelta.current = 0.4;
          backgroundPulseOpacity.current =
            backgroundPulseOpacity.current + 0.01;

          if (backgroundPulseOpacity.current > 180) {
            backgroundPulseOpacity.current = 180;
          }
        }
      }
    }

    if (toValue.current > canvas.height) {
      // playing.current = false;
      gameOver.current = true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      pixelRadius.current = 3;

      const highScore = parseInt(
        localStorage.getItem(today.toISOString() + "-highscore") || "0"
      );
      const thisScore = ((new Date().getTime() - time.current) / 1000).toFixed(
        1
      );
      console.log("DIAPLSY TIME", thisScore);
      if (highScore < parseFloat(thisScore)) {
        localStorage.setItem(today.toISOString() + "-highscore", thisScore);
      }
      setDummy(Math.random());
    }

    window.requestAnimationFrame(draw);
  };

  useEffect(() => {
    init();
  }, [canvasRef.current]);

  const calculateDistance = (x1: number, y1: number) => {
    let closest = 100000;
    let closestIndex = -1;

    currentCoords.current!.forEach((coord, i) => {
      const distance = Math.hypot(coord[0] - x1, coord[1] - y1);
      if (distance < closest) {
        closest = distance;
        closestIndex = i;
      }
    });

    if (currentCoords.current![closestIndex]) {
      currentCoords.current![closestIndex] = getRandomPosition();
    }

    return closest;
  };

  const scoreClick = (distance: number) => {
    console.log(distance);
    if (distance < 1.5) {
      toValue.current -= 10 * correctWeight.current;
    } else if (distance < 10) {
      toValue.current -= (10 - distance) * correctWeight.current;
    } else if (distance > 30) {
      toValue.current += 30;
    } else if (distance > 10) {
      toValue.current += 15;
    }

    toValue.current = Math.max(0, toValue.current);
    if (neverClicked.current) {
      toValueDelta.current = 0.3;
      time.current = Date.now();
      neverClicked.current = false;
    }

    // currentCoords.current = getRandomPositions();
  };

  const resetGame = () => {
    playing.current = true;
    gameOver.current = false;

    toValue.current = 0;
    currentValue.current = 0;
    currentCoords.current = getRandomPositions();
    time.current = Date.now();
    correctWeight.current = 10;
    pixelRadius.current = 5;
    toValueDelta.current = 0;
    backgroundPulseOpacity.current = 0;
    neverClicked.current = true;

    setDummy(Math.random());
    draw();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playsToday = localStorage.getItem(today.toISOString());

    if (!playsToday) {
      localStorage.setItem(today.toISOString(), "1");
    } else {
      localStorage.setItem(today.toISOString(), parseInt(playsToday) + 1 + "");
    }
  };

  function getCursorPosition(
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [x, y];
  }

  return (
    <>
      <div className={styles.container}>
        {!playing.current && !gameOver.current && (
          <Play resetGame={resetGame} />
        )}
        {gameOver.current && (
          <GameOver displayTime={displayTime} resetGame={resetGame} />
        )}
        {playing.current && !gameOver.current && (
          <div className={styles.time}>{displayTime}</div>
        )}
        <canvas
          onClick={(e) => {
            // toValue.current = canvasRef.current!.height - e.clientY;
            scoreClick(calculateDistance(...getCursorPosition(e)));
          }}
          width={800}
          height={600}
          ref={canvasRef}
          className={styles.canvas}
        ></canvas>
      </div>
      <div className={styles.notSupported}>This game is not for mobile.</div>
    </>
  );
}

export default App;

/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import logo from "./logo.svg";
import "./App.css";
import styles from "./styles.module.css";

function GameOver(props: { displayTime: string; resetGame: () => void }) {
  const [canRepeat, setCanRepeat] = useState(true);
  const [unclickable, setUnclickable] = useState(true);
  const [copied, setCopied] = useState(false);

  function textToClipboard(text: string) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
  }

  const copyHighscore = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    textToClipboard(
      `I lasted ${localStorage.getItem(
        today.toISOString() + "-highscore"
      )} seconds in wordle, can you beat me?`
    );
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playsToday = localStorage.getItem(today.toISOString());

    if (parseInt(playsToday || "0") > 3) {
      setCanRepeat(false);
    }

    setTimeout(() => {
      setUnclickable(false);
    }, 1500);
  }, []);

  return (
    <div
      className={styles.gameOver}
      onClick={canRepeat && !unclickable ? props.resetGame : () => {}}
    >
      You lasted {props.displayTime} seconds.
      {canRepeat ? (
        <div>Click to play again.</div>
      ) : (
        <div>Come back tomorrow to play again</div>
      )}
      <div onClick={copyHighscore} className={styles.share}>
        {copied ? "Copied to clipboard." : "Share today's high score."}
      </div>
    </div>
  );
}

export default GameOver;

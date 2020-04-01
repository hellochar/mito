import { Button } from "game/ui/common/Button";
import Character from "game/ui/common/Character";
import React, { useEffect } from "react";
import "./StartScreen.scss";

const StartScreen: React.FC<{ onStart: () => void }> = React.memo(({ onStart }) => {
  // useEffect(() => {
  //   mitoStartScreen.play();
  //   return () => {
  //     mitoStartScreen.stop();
  //   };
  // }, []);
  useEffect(() => {
    const listenForEnter = (event: KeyboardEvent) => {
      if (event.code === "Enter" || event.code === "Space") {
        onStart();
      }
    };
    window.addEventListener("keydown", listenForEnter);
    return () => {
      window.removeEventListener("keydown", listenForEnter);
    };
  }, [onStart]);

  return (
    <div className="start-screen">
      <h1>
        Mito
        <Character size="small" className="mito-i" />
      </h1>
      <Button color="green" onClick={onStart}>
        Start Game
      </Button>
    </div>
  );
});

export default StartScreen;

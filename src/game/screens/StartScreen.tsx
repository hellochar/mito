import { mitoStartScreen } from "game/audio";
import { Button } from "game/ui/common/Button";
import Character from "game/ui/common/Character";
import React from "react";
import "./StartScreen.scss";

const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  React.useEffect(() => {
    mitoStartScreen.play();
    return () => {
      mitoStartScreen.stop();
    };
  }, []);

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
};

export default StartScreen;

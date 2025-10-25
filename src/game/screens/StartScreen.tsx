import { Button } from "game/ui/common/Button";
import Character from "game/ui/common/Character";
import { params, setSandboxMode } from "game/params";
import React, { useEffect, useState } from "react";
import { FaDiscord } from "react-icons/fa";
import "./StartScreen.scss";

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = React.memo(({ onStart }) => {
  const [showGameModeSelection, setShowGameModeSelection] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'normal' | 'sandbox'>('normal');

  // useEffect(() => {
  //   mitoStartScreen.play();
  //   return () => {
  //     mitoStartScreen.stop();
  //   };
  // }, []);
  
  useEffect(() => {
    const listenForEnter = (event: KeyboardEvent) => {
      if (event.code === "Enter" || event.code === "Space") {
        if (!showGameModeSelection) {
          setShowGameModeSelection(true);
        } else {
          handleStartGame();
        }
      }
    };
    window.addEventListener("keydown", listenForEnter);
    return () => {
      window.removeEventListener("keydown", listenForEnter);
    };
  }, [showGameModeSelection, selectedMode]);

  const handleStartGame = () => {
    // Set sandbox mode based on selection
    setSandboxMode(selectedMode === 'sandbox');
    
    // Add body class for styling
    if (selectedMode === 'sandbox') {
      document.body.classList.add('sandbox-mode');
    } else {
      document.body.classList.remove('sandbox-mode');
    }
    
    onStart();
  };

  const handleContinueClick = () => {
    setShowGameModeSelection(true);
  };

  if (!showGameModeSelection) {
    return (
      <div className="start-screen">
        <h1>
          Mito
          <Character size="small" className="mito-i" />
        </h1>
        <div className="bottom-area">
          <Button color="green" onClick={handleContinueClick}>
            Continue Game
          </Button>
          <a className="discord" rel="noopener noreferrer" target="_blank" href="http://discord.gg/N8wWwPX">
            <FaDiscord />
          </a>
        </div>
        <div className="game-version">v0.9.1-dev (Sandbox Mode)</div>
      </div>
    );
  }

  return (
    <div className="start-screen mode-selection">
      <h1>
        Mito
        <Character size="small" className="mito-i" />
      </h1>
      
      <div className="game-mode-selection">
        <h2>Choose Game Mode</h2>
        
        <div className="mode-options">
          <div 
            className={`mode-option ${selectedMode === 'normal' ? 'selected' : ''}`}
            onClick={() => setSelectedMode('normal')}
          >
            <div className="mode-icon">🌱</div>
            <h3>Normal Mode</h3>
            <p>The classic Mito experience with survival challenges, resource management, and evolutionary progression.</p>
            <ul>
              <li>Resource scarcity</li>
              <li>Environmental threats</li>
              <li>Seasonal changes</li>
              <li>Natural game progression</li>
            </ul>
          </div>
          
          <div 
            className={`mode-option ${selectedMode === 'sandbox' ? 'selected' : ''}`}
            onClick={() => setSelectedMode('sandbox')}
          >
            <div className="mode-icon">🧪</div>
            <h3>Sandbox Mode</h3>
            <p>Creative mode with unlimited resources and environmental control for experimentation and learning.</p>
            <ul>
              <li>Infinite resources</li>
              <li>Environmental control</li>
              <li>Speed controls</li>
              <li>No survival pressure</li>
            </ul>
          </div>
        </div>
        
        <div className="mode-actions">
          <Button 
            color="gray" 
            onClick={() => setShowGameModeSelection(false)}
          >
            Back
          </Button>
          <Button 
            color="green" 
            onClick={handleStartGame}
          >
            Start {selectedMode === 'sandbox' ? 'Sandbox' : 'Normal'} Game
          </Button>
        </div>
      </div>
      
      <div className="game-version">v0.9.1-dev (Sandbox Mode)</div>
    </div>
  );
});

export default StartScreen;

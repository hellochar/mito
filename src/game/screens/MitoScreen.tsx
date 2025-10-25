import { PopulationAttempt } from "game/app";
import { GameResult } from "game/gameResult";
import { SketchComponent } from "game/screens/sketch/SketchComponent";
import SandboxControls from "game/ui/sandbox/SandboxControls";
import { params } from "game/params";
import * as React from "react";
import "./MitoScreen.scss";

export interface IMitoInstanceProps {
  attempt: PopulationAttempt;
  onWinLoss: (result: GameResult) => void;
}

interface MitoScreenState {
  gameSpeedMultiplier: number;
}

export default class MitoScreen extends React.PureComponent<IMitoInstanceProps, MitoScreenState> {
  private sketchRef: React.RefObject<SketchComponent>;
  
  constructor(props: IMitoInstanceProps) {
    super(props);
    this.state = {
      gameSpeedMultiplier: 1
    };
    this.sketchRef = React.createRef();
  }

  public render() {
    return (
      <div className="full-page-sketch" ref={this.handleDivRef}>
        <SketchComponent ref={this.sketchRef} {...this.props} />
        {params.sandboxMode && (
          <SandboxControls
            onResourceChange={this.handleResourceChange}
            onEnvironmentChange={this.handleEnvironmentChange}
            onSpeedChange={this.handleSpeedChange}
          />
        )}
      </div>
    );
  }

  private handleDivRef = (div: HTMLDivElement | null) => {
    if (div != null) {
      // this.requestFullscreen(div);
    } else {
      this.exitFullscreen();
    }
  };

  private exitFullscreen() {
    if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
  }
  
  // Sandbox control handlers
  private handleResourceChange = (resource: string, amount: number) => {
    // This would interface with the game engine to add resources
    // For now, we'll add a console log to show it's working
    console.log(`Sandbox: Adding ${amount} ${resource} to player`);
    
    // In a full implementation, this would call into the game world
    // to add resources to the player's inventory
    if (this.sketchRef.current) {
      // this.sketchRef.current.addResourceToPlayer(resource, amount);
    }
  };
  
  private handleEnvironmentChange = (setting: string, value: any) => {
    console.log(`Sandbox: Setting ${setting} to ${value}`);
    
    // Handle specific environment changes
    switch (setting) {
      case 'forceNight':
        // Update game params
        params.forceNight = value;
        break;
      case 'infiniteResources':
        // This would modify game mechanics
        break;
      case 'noEnvironmentalThreats':
        // This would disable threats like insects, weather, etc.
        break;
    }
    
    if (this.sketchRef.current) {
      // this.sketchRef.current.updateEnvironmentSetting(setting, value);
    }
  };
  
  private handleSpeedChange = (multiplier: number) => {
    console.log(`Sandbox: Changing game speed to ${multiplier}x`);
    
    this.setState({ gameSpeedMultiplier: multiplier });
    
    if (this.sketchRef.current) {
      // this.sketchRef.current.setGameSpeed(multiplier);
    }
  };
}

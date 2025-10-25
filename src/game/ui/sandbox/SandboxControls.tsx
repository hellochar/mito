import { Button } from "@blueprintjs/core";
import { params } from "game/params";
import React, { useState } from "react";
import "./SandboxControls.scss";

interface SandboxControlsProps {
  onResourceChange?: (resource: string, amount: number) => void;
  onEnvironmentChange?: (setting: string, value: any) => void;
  onSpeedChange?: (multiplier: number) => void;
}

const SandboxControls: React.FC<SandboxControlsProps> = ({
  onResourceChange = () => {},
  onEnvironmentChange = () => {},
  onSpeedChange = () => {},
}) => {
  const [selectedResource, setSelectedResource] = useState("sugar");
  const [resourceAmount, setResourceAmount] = useState(100);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [isNightMode, setIsNightMode] = useState(false);
  const [infiniteResources, setInfiniteResources] = useState(false);
  const [noEnvironmentalThreats, setNoEnvironmentalThreats] = useState(false);

  if (!params.sandboxMode) {
    return null;
  }

  const handleAddResource = () => {
    onResourceChange(selectedResource, resourceAmount);
  };

  const handleSpeedChange = (multiplier: number) => {
    setGameSpeed(multiplier);
    onSpeedChange(multiplier);
  };

  const handleToggleNight = () => {
    const newNightMode = !isNightMode;
    setIsNightMode(newNightMode);
    onEnvironmentChange("forceNight", newNightMode);
  };

  const handleToggleInfiniteResources = () => {
    const newInfiniteMode = !infiniteResources;
    setInfiniteResources(newInfiniteMode);
    onEnvironmentChange("infiniteResources", newInfiniteMode);
  };

  const handleToggleEnvironmentalThreats = () => {
    const newThreatsMode = !noEnvironmentalThreats;
    setNoEnvironmentalThreats(newThreatsMode);
    onEnvironmentChange("noEnvironmentalThreats", newThreatsMode);
  };

  return (
    <div className="sandbox-controls">
      <div className="sandbox-panel">
        <h3>🧪 Sandbox Controls</h3>
        
        <div className="control-group">
          <h4>Resources</h4>
          <div className="resource-controls">
            <select 
              value={selectedResource} 
              onChange={(e) => setSelectedResource(e.target.value)}
              className="bp3-select"
            >
              <option value="sugar">Sugar</option>
              <option value="water">Water</option>
              <option value="co2">CO₂</option>
            </select>
            <input
              type="number"
              value={resourceAmount}
              onChange={(e) => setResourceAmount(Number(e.target.value))}
              className="bp3-input"
              placeholder="Amount"
            />
            <Button onClick={handleAddResource} small>Add</Button>
          </div>
          <div className="toggle-controls">
            <label>
              <input
                type="checkbox"
                checked={infiniteResources}
                onChange={handleToggleInfiniteResources}
              />
              Infinite Resources
            </label>
          </div>
        </div>

        <div className="control-group">
          <h4>Environment</h4>
          <div className="environment-controls">
            <label>
              <input
                type="checkbox"
                checked={isNightMode}
                onChange={handleToggleNight}
              />
              Force Night
            </label>
            <label>
              <input
                type="checkbox"
                checked={noEnvironmentalThreats}
                onChange={handleToggleEnvironmentalThreats}
              />
              Disable Environmental Threats
            </label>
          </div>
        </div>

        <div className="control-group">
          <h4>Game Speed</h4>
          <div className="speed-controls">
            <Button 
              onClick={() => handleSpeedChange(0.5)} 
              active={gameSpeed === 0.5}
              small
            >
              0.5x
            </Button>
            <Button 
              onClick={() => handleSpeedChange(1)} 
              active={gameSpeed === 1}
              small
            >
              1x
            </Button>
            <Button 
              onClick={() => handleSpeedChange(2)} 
              active={gameSpeed === 2}
              small
            >
              2x
            </Button>
            <Button 
              onClick={() => handleSpeedChange(5)} 
              active={gameSpeed === 5}
              small
            >
              5x
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxControls;

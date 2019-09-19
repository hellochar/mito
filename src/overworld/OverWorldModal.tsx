import React from "react";
import styled, { keyframes, CSSProperties } from "styled-components";

import { CameraState } from "./OverWorldMap";
import { HexTile } from "./hexTile";
import { pixelPosition } from "./hexMath";

interface OverWorldModalProps {
  camera: CameraState;
  tile: HexTile;
  children: React.ReactNode;
}

const opacifyIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-80px) scale(0.75);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
`;

const OverworldModalPositioner = styled.div`
  position: absolute;
  left: 20px;
  align-self: center;
  justify-self: top;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  color: black;
  animation: ${opacifyIn} 0.2s both;

  &::before {
    position: absolute;
    top: 50%;
    transform: translate(-100%, -50%);
    left: 0;
    content: "";
    border: 20px solid transparent;
    border-right-color: rgba(255, 255, 255, 0.9);
  }
`;

function OverWorldModal({ tile, camera, children }: OverWorldModalProps) {
  const [px, py] = pixelPosition(tile, camera);
  // this element is put in the center
  const container: CSSProperties = {
    zIndex: 1,
    position: "absolute",
    left: px + camera.scale * 0.5,
    top: py,
    display: "flex",
  };
  return (
    <div style={container}>
      <OverworldModalPositioner>
        {children}
      </OverworldModalPositioner>
    </div>
  );
}

export default OverWorldModal;

import React from "react";
import styled from "styled-components";

import { HexTile } from "./hexTile";
import Expand from "../common/Expand";

interface HexTileInfoProps {
  tile: HexTile;
  onClickPlay: (level: HexTile) => void;
}

const HexTileInfoContainer = styled.div`
  margin: 10px;
  width: 320px;
`;

const PlayButton = styled.button`
  cursor: pointer;
  padding: 10px;
  width: 100%;
  background-color: darkgreen;
  color: white;
  font-size: 18px;
`;

const ExpandDetails = styled.div`
  text-transform: uppercase;
  font-size: 12px;
  font-family: sans-serif;
`;

function HexTileInfo({ tile, onClickPlay }: HexTileInfoProps) {
  const handleClickPlay = () => {
    onClickPlay(tile);
  }

  const playButtonElement = (tile.info.height === -1 || tile.info.conquered) ? null :
    <PlayButton onClick={handleClickPlay}>Populate</PlayButton>;

  const header =
    tile.info.conquered ? <h1>Populated</h1> :
    (tile.info.height === -1) ? <h1>Deep Water</h1> :
    <h1>Unexplored</h1>;

  const stringifyInfo = { ...tile.info };
  delete stringifyInfo.world;

  const expand = (tile.info.height === -1) ? null :
    <Expand shrunkElements={
      <ExpandDetails>Details</ExpandDetails>
    }>
      <pre style={{ fontSize: "12px" }}>{JSON.stringify(stringifyInfo, null, 4)}</pre>
    </Expand>;

  return (
    <HexTileInfoContainer>
      {header}
      {expand}
      {playButtonElement}
    </HexTileInfoContainer>
  );
}

export default HexTileInfo;

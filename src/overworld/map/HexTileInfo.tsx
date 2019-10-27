import { lineage, Species } from "evolution/species";
import React from "react";
import Dropdown, { Option } from 'react-dropdown';
import { Button } from "../../common/Button";
import Expand from "../../common/Expand";
import MP from "../../common/MP";
import { HexTile } from "../hexTile";
import "./HexTileInfo.scss";



interface HexTileInfoProps {
  tile: HexTile;
  onClickPlay: (level: HexTile, species: Species) => void;
  rootSpecies: Species;
}

function HexTileInfo({ tile, onClickPlay, rootSpecies }: HexTileInfoProps) {
  const allSpecies = React.useMemo(() => lineage(rootSpecies), [rootSpecies]);

  const [selectedSpecies, setSelectedSpecies] = React.useState(allSpecies[0].id);

  const handleClickPlay = () => {
    onClickPlay(tile, allSpecies.find((s) => s.id === selectedSpecies)!);
  };

  const { height, flora } = tile.info;

  const options: Option[] = allSpecies.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const handleDropdownChange = (option: Option) => {
    setSelectedSpecies(option.value);
  };

  const playButtonElement =
    (height === -1 || flora != null) ? null : (
      <div className="play-selector">
        <Dropdown options={options} value={selectedSpecies} onChange={handleDropdownChange} />
        <Button color="green" className="play-button" onClick={handleClickPlay}>
          Populate
        </Button>
      </div>
    );

  const header = flora != null ? (
    <h1>Inhabited by {flora.species.name}<small><MP amount={flora.mutationPointsPerEpoch} /> per epoch</small></h1>
  ) : tile.info.height === -1 ? (
    <h1>Deep Water</h1>
  ) : (
        <h1>Uninhabited</h1>
      );


  const expand =
    tile.info.height === -1 ? null : (
      <Expand shrunkElements={<div className="details">Details</div>}>
        <pre style={{ fontSize: "12px" }}>{JSON.stringify(tile.info, null, 4)}</pre>
      </Expand>
    );

  return (
    <div className="hex-tile-info-container">
      {header}
      {expand}
      {playButtonElement}
    </div>
  );
}

export default HexTileInfo;

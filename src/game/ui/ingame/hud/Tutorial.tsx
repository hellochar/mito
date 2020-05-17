import classNames from "classnames";
import { Player, StepStats } from "core";
import { Action } from "core/player/action";
import { Cell } from "core/tile";
import { EventPhotosynthesis } from "core/tile/tileEvent";
import Mito from "game/mito/mito";
import * as React from "react";
import { GeneSeed } from "std/genes";
import { HUDProps } from ".";
import { HotkeyButton } from "../HotkeyButton";
import "./Tutorial.scss";

export const Tutorial = ({ mito, isViewerOpen }: HUDProps & { isViewerOpen: boolean }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const handleDone = React.useCallback(
    (index) => {
      if (index === activeIndex) {
        setActiveIndex((i) => i + 1);
      }
    },
    [activeIndex]
  );
  return (
    <div className="hud-left">
      {tutorialSteps.map((Step, index) => (
        <TutorialStepContainer
          mito={mito}
          active={activeIndex === index}
          isViewerOpen={isViewerOpen}
          Step={Step}
          index={index}
          isFirst={index === 0}
          onDone={handleDone}
          key={index}
        />
      ))}
    </div>
  );
};

function useCountActions(player: Player, predicate: (action: Action) => boolean) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const cb = (action: Action) => {
      if (predicate(action)) {
        setCount((c) => c + 1);
      }
    };
    player.on("action", cb);
    return () => {
      player.off("action", cb);
    };
  });
  return count;
}

function useCountActionTarget(player: Player, predicate: (a: Action) => boolean, target: number) {
  const count = useCountActions(player, predicate);
  return count / target;
}

interface TutorialStepProps {
  player: Player;
  setPercentDone: (percent: number) => void;
  active: boolean;
  isViewerOpen: boolean;
}

const build = (name: string) => {
  return (action: Action) => action.type === "build" && action.cellType.name === name;
};

const tutorialSteps: Array<React.FC<TutorialStepProps>> = [
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, (action) => action.type === "move", 120));
    return (
      <>
        Move - <HotkeyButton hotkey="W" />
        <HotkeyButton hotkey="A" />
        <HotkeyButton hotkey="S" />
        <HotkeyButton hotkey="D" />
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Tissue"), 3));
    return (
      <>
        Grow Tissue - <HotkeyButton hotkey="1" />, click.{" "}
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Root"), 4));
    return (
      <>
        Grow Roots - <HotkeyButton hotkey="3" />, click Soil.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(
      useCountActionTarget(
        player,
        (action) => action.type === "pickup" && Cell.is(action.target) && action.target.displayName === "Root",
        14
      )
    );
    return (
      <>
        Take water from Roots - <HotkeyButton hotkey="Q" />, click Root.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Leaf"), 4));
    return (
      <>
        Grow Leaves - <HotkeyButton hotkey="2" />, click Air.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    setPercentDone(
      useCountActionTarget(
        player,
        (action) => action.type === "drop" && Cell.is(action.target) && action.target.displayName === "Leaf",
        14
      )
    );
    return (
      <>
        Put water in Leaf - <HotkeyButton hotkey="Q" />, click Leaf.
      </>
    );
  },
  ({ player, setPercentDone }) => {
    const [sugarMade, setSugarMade] = React.useState(0);
    React.useEffect(() => {
      const cb = (stats: StepStats) => {
        const sugarMade = stats.events.photosynthesis.reduce(
          (sum, event: EventPhotosynthesis) => event.sugarMade + sum,
          0
        );
        setSugarMade((s) => s + sugarMade);
      };
      player.world.on("step", cb);
      return () => {
        player.world.off("step", cb);
      };
    }, [player.world]);
    setPercentDone(sugarMade / 4);
    return <>Wait for Photosynthesis.</>;
  },
  ({ player, setPercentDone }) => {
    setPercentDone(useCountActionTarget(player, build("Seed"), 1));
    return (
      <>
        Grow Seed - <HotkeyButton hotkey="4" />, click.
      </>
    );
  },
  ({ player, setPercentDone, active }) => {
    setPercentDone(
      useCountActionTarget(
        player,
        (action) =>
          active && action.type === "drop" && Cell.is(action.target) && action.target.displayName === "Tissue",
        7
      )
    );
    return (
      <>
        Feed Tissue - <HotkeyButton hotkey="Q" />, click Tissue.
      </>
    );
  },
  // ({ player, setPercentDone, isViewerOpen, active }) => {
  //   const percentDone = isViewerOpen && active ? 1 : 0;
  //   setPercentDone(percentDone);
  //   return (
  //     <>
  //       Look at your Genes - <HotkeyButton hotkey="Tab" />.
  //     </>
  //   );
  // },
  ({ player, setPercentDone }) => {
    const percentDone =
      (Array.from(player.world.mpEarners.keys())[0]?.findGene(GeneSeed)?.state.energyRecieved ?? 0) / 100;
    setPercentDone(percentDone);
    return <>Get seed to 150 energy.</>;
  },
];

const TutorialStepContainer: React.FC<{
  mito: Mito;
  index: number;
  active: boolean;
  isViewerOpen: boolean;
  isFirst: boolean;
  Step: React.FC<TutorialStepProps>;
  onDone: (index: number) => void;
}> = ({ mito, active, index, isViewerOpen, isFirst, Step, onDone }) => {
  const [percentDoneRaw, setPercentDone] = React.useState(0);
  const percentDone = Math.min(percentDoneRaw, 1);
  const isDone = percentDone >= 1;

  React.useEffect(() => {
    if (isDone) {
      onDone(index);
    }
  }, [active, index, isDone, onDone]);

  const percentCss = `${(percentDone * 100).toFixed(1)}%`;
  const style: React.CSSProperties = {
    // background: `linear-gradient(to right, ${filled}, ${filled} ${percentCss}, transparent ${percentCss}, transparent)`,
    width: percentCss,
  };

  // kill animation in the WASD tutorial
  if (isFirst) {
    style.transition = "unset";
  }

  return (
    <div className={classNames("instruction", { active, first: isFirst, done: isDone })}>
      <div className="background-fill" style={style} />
      <div className="instruction-content">
        <Step player={mito.world.player} setPercentDone={setPercentDone} active={active} isViewerOpen={isViewerOpen} />
      </div>
    </div>
  );
};

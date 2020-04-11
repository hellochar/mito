import React, { useCallback, useState } from "react";
import { IoMdMore } from "react-icons/io";
import Popover from "react-popover";
import "./MoreOptionsPopover.scss";

const MoreOptionsPopover: React.FC = ({ children }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const handleMoreClicked = useCallback(() => {
    setMoreOpen((open) => !open);
  }, []);
  const handleOuterAction = useCallback(() => {
    setMoreOpen(false);
  }, []);
  const popoverContent = (
    <div className="more-options">
      {children}
      <button onClick={handleOuterAction}>Back</button>
    </div>
  );
  return (
    <Popover
      isOpen={moreOpen}
      preferPlace="right"
      enterExitTransitionDurationMs={100}
      body={popoverContent}
      onOuterAction={handleOuterAction}
    >
      <IoMdMore className="more-options-icon" onClick={handleMoreClicked} />
    </Popover>
  );
};

export default MoreOptionsPopover;

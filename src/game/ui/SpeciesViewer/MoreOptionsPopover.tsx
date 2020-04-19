import { Popover } from "@blueprintjs/core";
import React, { useCallback, useState } from "react";
import { IoMdMore } from "react-icons/io";
import "./MoreOptionsPopover.scss";

const MoreOptionsPopover: React.FC = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleMoreClicked = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);
  const handleOuterAction = useCallback(() => {
    setIsOpen(false);
  }, []);
  const popoverContent = (
    <div className="more-options">
      {children}
      <button onClick={handleOuterAction}>Back</button>
    </div>
  );
  return (
    <Popover
      isOpen={isOpen}
      position="right"
      transitionDuration={100}
      content={popoverContent}
      popoverClassName="more-options-popover"
    >
      <IoMdMore className="more-options-icon" onClick={handleMoreClicked} />
    </Popover>
  );
};

export default MoreOptionsPopover;

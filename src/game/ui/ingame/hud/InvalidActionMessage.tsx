import * as React from "react";
import uuid from "uuid";
export const InvalidActionMessage: React.FC<{
  invalidAction: {
    message: string;
  };
}> = React.memo(({ invalidAction }) => {
  // get new id on every render (aka reference equal invalidAction)
  // to trigger animation each time
  const id = uuid();
  return (
    <div className="hud-below-center">
      <div className="invalid-action" key={id}>
        {invalidAction.message}
      </div>
    </div>
  );
});

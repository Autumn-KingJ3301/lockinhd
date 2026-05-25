import React from "react";

export const IdleView: React.FC = () => (
  <div className="mode-container" key="idle">
    <div className="empty-state">
      No active session.
      <br />
      Type above to lock in on a task, or `/add [task]` to queue it.
    </div>
  </div>
);

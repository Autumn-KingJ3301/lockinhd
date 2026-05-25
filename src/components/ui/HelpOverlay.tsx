import React from "react";

export const HelpOverlay: React.FC = () => (
  <div className="help-overlay" key="help">
    <div className="help-header">
      <span className="help-title">COMMAND REFERENCE</span>
    </div>
    <div className="help-body">
      <div className="help-section">
        <div className="help-section-label">Sessions</div>
        <div className="help-row"><kbd>/done</kbd><kbd>/d</kbd><span>End current session</span></div>
        <div className="help-row"><kbd>/timer [time]</kbd><span>Set inline session timer</span></div>
        <div className="help-row"><kbd>/continue</kbd><kbd>/con</kbd><span>Resume last session</span></div>
        <div className="help-row"><kbd>/rev [n]</kbd><span>View data for revision n (history only)</span></div>
      </div>
      <div className="help-section">
        <div className="help-section-label">Task Queue & Panic</div>
        <div className="help-row"><kbd>/add [task]</kbd><span>Add task to queue</span></div>
        <div className="help-row"><kbd>/panic [time] [task]</kbd><span>Start chore in panic mode</span></div>
        <div className="help-row"><kbd>/rq [n]</kbd><span>Remove queue item at index n</span></div>
        <div className="help-row"><span className="help-tip">Tab</span><span>Autofill first queued task</span></div>
      </div>
      <div className="help-section">
        <div className="help-section-label">Todos</div>
        <div className="help-row"><kbd>/todo [step]</kbd><kbd>/t</kbd><span>Add a subtask</span></div>
        <div className="help-row"><kbd>/check [n]</kbd><kbd>/c</kbd><span>Toggle todo n (or next unchecked)</span></div>
        <div className="help-row"><kbd>/remove [n]</kbd><kbd>/r</kbd><span>Remove todo at index n</span></div>
      </div>
      <div className="help-section">
        <div className="help-section-label">Braindump &amp; Sidetracks</div>
        <div className="help-row"><kbd>/sidetrack [idea]</kbd><kbd>/s</kbd><span>Capture a jumping thought</span></div>
        <div className="help-row"><kbd>/di [n]</kbd><span>Delete inbox idea at index n</span></div>
      </div>
      <div className="help-section">
        <div className="help-section-label">ADHD Focus Mode</div>
        <div className="help-row"><kbd>/zen</kbd><kbd>/z</kbd><span>Toggle Zen mode (hide panels)</span></div>
        <div className="help-row"><kbd>/sound</kbd><kbd>/so</kbd><span>Toggle audio feedback</span></div>
        <div className="help-row"><span className="help-tip">Q S D ↵</span><span>Triage sidetracks in wrap mode</span></div>
        <div className="help-row"><span className="help-tip">type + ↵</span><span>Save a resume cue in wrap mode</span></div>
      </div>
      <div className="help-section">
        <div className="help-section-label">Panels &amp; Export</div>
        <div className="help-row"><kbd>/tasks</kbd><span>Toggle global tasks panel</span></div>
        <div className="help-row"><kbd>/history</kbd><kbd>/h</kbd><span>Toggle history panel</span></div>
        <div className="help-row"><kbd>/inbox</kbd><kbd>/i</kbd><span>Toggle inbox panel</span></div>
        <div className="help-row"><kbd>/theme [light|dark|system]</kbd><span>Change theme</span></div>
        <div className="help-row"><kbd>/export</kbd><kbd>/e</kbd><span>Copy session log to clipboard</span></div>
      </div>
      <div className="help-section">
        <div className="help-section-label">Keyboard Shortcuts</div>
        <div className="help-row"><span className="help-tip">Alt+T</span><span>Toggle tasks panel</span></div>
        <div className="help-row"><span className="help-tip">Alt+H</span><span>Toggle history panel</span></div>
        <div className="help-row"><span className="help-tip">Alt+I</span><span>Toggle inbox panel</span></div>
        <div className="help-row"><span className="help-tip">Esc</span><span>Close this help panel</span></div>
      </div>
    </div>
  </div>
);

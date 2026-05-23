import React from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { generateMarkdownExport } from "../utils/markdownExporter";

export const Toolbar: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const theme = useLockinStore((state) => state.theme);
  const isSystemDark = useLockinStore((state) => state.isSystemDark);
  const setTheme = useLockinStore((state) => state.setTheme);
  const showHistoryPanel = useLockinStore((state) => state.showHistoryPanel);
  const setShowHistoryPanel = useLockinStore((state) => state.setShowHistoryPanel);
  const showInboxPanel = useLockinStore((state) => state.showInboxPanel);
  const setShowInboxPanel = useLockinStore((state) => state.setShowInboxPanel);
  const showTasksPanel = useLockinStore((state) => state.showTasksPanel);
  const setShowTasksPanel = useLockinStore((state) => state.setShowTasksPanel);
  const sessions = useLockinStore((state) => state.sessions);
  const queue = useLockinStore((state) => state.queue);
  const idleSidetracks = useLockinStore((state) => state.idleSidetracks);
  const setToastMsg = useLockinStore((state) => state.setToastMsg);

  const handleThemeToggle = () => {
    if (theme === "system") {
      setTheme(isSystemDark ? "light" : "dark");
    } else {
      setTheme("system");
    }
  };

  const handleExport = () => {
    const md = generateMarkdownExport(sessions, idleSidetracks);
    navigator.clipboard.writeText(md)
      .then(() => setToastMsg("Copied focus log to clipboard!"))
      .catch(() => setToastMsg("Copy failed."));
  };

  return (
    <div className="theme-toggle-container">
      <button className="theme-toggle-btn" onClick={handleThemeToggle} style={{ marginRight: "6px" }}>
        {theme === "system"
          ? `Theme: System (${isSystemDark ? "Dark" : "Light"})`
          : theme === "light"
          ? "Theme: Light"
          : "Theme: Dark"}
      </button>
      <button
        className="theme-toggle-btn"
        onClick={handleExport}
        style={{ marginRight: "6px" }}
      >
        Export Log
      </button>
      <button
        className="theme-toggle-btn"
        onClick={() => setShowHistoryPanel(!showHistoryPanel)}
        style={{ marginRight: "6px" }}
      >
        {showHistoryPanel ? "Hide History" : "Show History"} ({sessions.length})
      </button>
      <button
        className="theme-toggle-btn"
        onClick={() => setShowTasksPanel(!showTasksPanel)}
        style={{ marginRight: "6px" }}
      >
        {showTasksPanel ? "Hide Tasks" : "Show Tasks"} ({queue.length})
      </button>
      <button
        className="theme-toggle-btn"
        onClick={() => setShowInboxPanel(!showInboxPanel)}
        style={{ marginRight: "6px" }}
      >
        {showInboxPanel ? "Hide Inbox" : "Show Inbox"} ({idleSidetracks.length})
      </button>
      {user && (
        <button
          className="theme-toggle-btn"
          onClick={() => navigate("/profile")}
          style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
        >
          Profile
        </button>
      )}
    </div>
  );
};

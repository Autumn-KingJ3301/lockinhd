import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useLockinStore } from "../store/useLockinStore";
import type { Archive } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStashDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────

const ArchivePreviewModal: React.FC<{
  archive: Archive;
  onClose: () => void;
  onRestore: () => void;
}> = ({ archive, onClose, onRestore }) => (
  <div
    className="panic-modal-overlay"
    style={{ zIndex: 1000 }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className="panic-modal"
      style={{ maxWidth: "480px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}
    >
      <div className="panic-header">
        <div className="panic-title" style={{ fontSize: "13px" }}>ARCHIVE PREVIEW</div>
        <button className="delete-btn" onClick={onClose} title="Close">×</button>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div className="task-label" style={{ marginBottom: "4px" }}>DATE</div>
          <div className="hint-text">{formatDate(archive.createdAt)}</div>
        </div>

        {/* Sessions */}
        <div>
          <div className="task-label" style={{ marginBottom: "8px" }}>
            SESSIONS ({archive.sessions.length})
          </div>
          {archive.sessions.length === 0 ? (
            <div className="hint-text">No sessions</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {archive.sessions.map((s, i) => (
                <div key={i} className="todo-item" style={{ cursor: "default", gap: "8px" }}>
                  <span className="todo-checkbox" style={{ minWidth: "28px", textAlign: "center" }}>
                    {i + 1}
                  </span>
                  <span className="todo-text">{s.task}</span>
                  {s.duration && (
                    <span className="hint-text" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                      {Math.round(s.duration / 60)}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue */}
        {archive.queue.length > 0 && (
          <div>
            <div className="task-label" style={{ marginBottom: "8px" }}>
              QUEUED TASKS ({archive.queue.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {archive.queue.map((q, i) => (
                <div key={i} className="todo-item" style={{ cursor: "default", gap: "8px" }}>
                  <span className="todo-checkbox" style={{ minWidth: "28px", textAlign: "center" }}>
                    {i + 1}
                  </span>
                  <span className="todo-text">{q.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inbox */}
        {archive.idleSidetracks.length > 0 && (
          <div>
            <div className="task-label" style={{ marginBottom: "8px" }}>
              INBOX IDEAS ({archive.idleSidetracks.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {archive.idleSidetracks.map((s, i) => (
                <div key={i} className="todo-item" style={{ cursor: "default", gap: "8px" }}>
                  <span className="todo-checkbox" style={{ minWidth: "28px", textAlign: "center" }}>
                    {i + 1}
                  </span>
                  <span className="todo-text">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="queue-item"
          onClick={onRestore}
          style={{ marginTop: "8px", borderColor: "var(--color-accent)" }}
        >
          <div className="queue-item-left">
            <span className="queue-text" style={{ color: "var(--color-accent)" }}>
              ↺ RESTORE THIS ARCHIVE
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
);

// ─── Stash Banner ──────────────────────────────────────────────────────────────

const StashBanner: React.FC = () => {
  const stash = useLockinStore((s) => s.stash);
  const popStash = useLockinStore((s) => s.popStash);
  const discardStash = useLockinStore((s) => s.discardStash);
  const [confirming, setConfirming] = useState(false);

  if (!stash) return null;

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-accent)",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="task-label" style={{ color: "var(--color-accent)", marginBottom: "2px" }}>
            STASH ACTIVE
          </div>
          <div className="hint-text">
            Previous workspace stashed on {formatStashDate(stash.stashedAt)} ·{" "}
            {stash.sessions.length} sessions · {stash.queue.length} tasks · {stash.idleSidetracks.length} ideas
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          id="stash-pop-btn"
          className="queue-item"
          onClick={popStash}
          style={{ flex: 1, borderColor: "var(--color-accent)" }}
        >
          <span className="queue-text" style={{ color: "var(--color-accent)", fontSize: "11px" }}>
            ↑ POP STASH
          </span>
        </button>
        {confirming ? (
          <>
            <button
              id="stash-discard-confirm-btn"
              className="queue-item"
              onClick={() => { discardStash(); setConfirming(false); }}
              style={{ flex: 1, borderColor: "var(--color-muted)" }}
            >
              <span className="queue-text" style={{ color: "var(--color-muted)", fontSize: "11px" }}>
                CONFIRM DISCARD
              </span>
            </button>
            <button
              className="queue-item"
              onClick={() => setConfirming(false)}
              style={{ borderColor: "var(--color-surface-2)" }}
            >
              <span className="queue-text" style={{ fontSize: "11px" }}>CANCEL</span>
            </button>
          </>
        ) : (
          <button
            id="stash-discard-btn"
            className="queue-item"
            onClick={() => setConfirming(true)}
            style={{ flex: 1, borderColor: "var(--color-muted)" }}
          >
            <span className="queue-text" style={{ color: "var(--color-muted)", fontSize: "11px" }}>
              ✕ DISCARD STASH
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Profile Page ─────────────────────────────────────────────────────────

export const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const archives = useLockinStore((s) => s.archives);
  const archivesLoading = useLockinStore((s) => s.archivesLoading);
  const sessions = useLockinStore((s) => s.sessions);
  const queue = useLockinStore((s) => s.queue);
  const idleSidetracks = useLockinStore((s) => s.idleSidetracks);
  const createArchive = useLockinStore((s) => s.createArchive);
  const restoreArchive = useLockinStore((s) => s.restoreArchive);
  const setToastMsg = useLockinStore((s) => s.setToastMsg);

  const [previewArchive, setPreviewArchive] = useState<Archive | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleArchive = async () => {
    if (!confirmArchive) {
      setConfirmArchive(true);
      return;
    }
    setArchiving(true);
    setConfirmArchive(false);
    try {
      createArchive();
      setToastMsg("Workspace archived! Starting fresh.");
      navigate("/");
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = (archiveId: string) => {
    setPreviewArchive(null);
    const { stashCreated } = restoreArchive(archiveId);
    if (stashCreated) {
      setToastMsg("Archive restored! Previous workspace pushed to stash.");
    } else {
      setToastMsg("Archive restored!");
    }
    navigate("/");
  };

  const workspaceEmpty =
    sessions.length === 0 && queue.length === 0 && idleSidetracks.length === 0;

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="empty-state">NOT LOGGED IN</div>
        <button className="queue-item first-item" onClick={() => navigate("/login")}>
          <span className="queue-text">GO TO LOGIN</span>
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {previewArchive && (
        <ArchivePreviewModal
          archive={previewArchive}
          onClose={() => setPreviewArchive(null)}
          onRestore={() => handleRestore(previewArchive.id)}
        />
      )}

      <header className="app-header">
        <div className="app-title">USER PROFILE</div>
        <button className="delete-btn" onClick={() => navigate("/")} title="Back to App">×</button>
      </header>

      <main className="app-content" style={{ gap: "20px" }}>
        {/* Avatar & Name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              style={{ width: "80px", height: "80px", borderRadius: "50%", border: "2px solid var(--color-accent)" }}
            />
          ) : (
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
              👤
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div className="task-name-large" style={{ marginBottom: "4px" }}>{user.displayName || "Anonymous User"}</div>
            <div className="hint-text">{user.email}</div>
          </div>
        </div>

        {/* Account Info */}
        <div className="todos-section">
          <div className="task-label">ACCOUNT INFO</div>
          <div className="todo-list">
            <div className="todo-item" style={{ cursor: "default" }}>
              <span className="todo-checkbox">[ID]</span>
              <span className="todo-text">{user.uid}</span>
            </div>
            <div className="todo-item" style={{ cursor: "default" }}>
              <span className="todo-checkbox">[PR]</span>
              <span className="todo-text">Provider: {user.providerData[0]?.providerId || "firebase"}</span>
            </div>
          </div>
        </div>

        <hr className="content-divider" />

        {/* ─── Stash Banner ─────────────────────────────────────────────────── */}
        <StashBanner />

        {/* ─── Archive Section ──────────────────────────────────────────────── */}
        <div className="todos-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div className="task-label">WORKSPACE ARCHIVE</div>
            {archivesLoading && <div className="hint-text">loading…</div>}
          </div>

          {/* Workspace summary */}
          <div
            style={{
              background: "var(--color-surface)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div className="hint-text" style={{ lineHeight: "1.8" }}>
              <span style={{ opacity: 0.6 }}>Current workspace: </span>
              <strong>{sessions.length} sessions</strong>
              {" · "}
              <strong>{queue.length} queued</strong>
              {" · "}
              <strong>{idleSidetracks.length} inbox ideas</strong>
            </div>
            {workspaceEmpty && (
              <div className="hint-text" style={{ color: "var(--color-accent)", fontSize: "11px" }}>
                Workspace is already clean ✓
              </div>
            )}
          </div>

          {/* Archive button */}
          {!workspaceEmpty && (
            confirmArchive ? (
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button
                  id="archive-confirm-btn"
                  className="queue-item"
                  onClick={handleArchive}
                  disabled={archiving}
                  style={{ flex: 1, borderColor: "var(--color-accent)" }}
                >
                  <span className="queue-text" style={{ color: "var(--color-accent)", fontSize: "11px" }}>
                    {archiving ? "ARCHIVING…" : "✓ CONFIRM ARCHIVE"}
                  </span>
                </button>
                <button
                  className="queue-item"
                  onClick={() => setConfirmArchive(false)}
                  style={{ borderColor: "var(--color-surface-2)" }}
                >
                  <span className="queue-text" style={{ fontSize: "11px" }}>CANCEL</span>
                </button>
              </div>
            ) : (
              <button
                id="archive-workspace-btn"
                className="queue-item"
                onClick={handleArchive}
                style={{ marginBottom: "12px", borderColor: "var(--color-accent)" }}
              >
                <div className="queue-item-left">
                  <span className="queue-text" style={{ color: "var(--color-accent)" }}>
                    ⊡ ARCHIVE WORKSPACE
                  </span>
                </div>
                <div className="queue-item-right">
                  <span className="hint-text">clears & snapshots all data</span>
                </div>
              </button>
            )
          )}

          {/* Archive Timeline */}
          {archives.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0", fontSize: "12px" }}>
              No archives yet — archive your workspace to start a timeline
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {archives.map((archive, idx) => (
                <div
                  key={archive.id}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    position: "relative",
                  }}
                >
                  {/* Timeline connector */}
                  {idx < archives.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: "22px",
                        bottom: "-8px",
                        width: "1px",
                        height: "8px",
                        background: "var(--color-surface-2)",
                      }}
                    />
                  )}

                  {/* Dot */}
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: idx === 0 ? "var(--color-accent)" : "var(--color-muted)",
                      flexShrink: 0,
                    }}
                  />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <div className="queue-text" style={{ fontSize: "12px" }}>{archive.label}</div>
                      {idx === 0 && (
                        <span
                          style={{
                            fontSize: "9px",
                            background: "var(--color-accent)",
                            color: "var(--color-bg)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}
                        >
                          LATEST
                        </span>
                      )}
                    </div>
                    <div className="hint-text" style={{ fontSize: "10px", marginTop: "2px" }}>
                      {archive.sessions.length} sessions · {archive.queue.length} tasks · {archive.idleSidetracks.length} ideas
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      id={`archive-preview-${archive.id}`}
                      className="delete-btn"
                      onClick={() => setPreviewArchive(archive)}
                      title="Preview"
                      style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px" }}
                    >
                      VIEW
                    </button>
                    <button
                      id={`archive-restore-${archive.id}`}
                      className="delete-btn"
                      onClick={() => setPreviewArchive(archive)}
                      title="Restore"
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        color: "var(--color-accent)",
                        borderColor: "var(--color-accent)",
                      }}
                    >
                      ↺
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="content-divider" />

        {/* Logout */}
        <button
          className="queue-item"
          onClick={handleLogout}
          style={{ marginTop: "auto", borderColor: "var(--color-muted)" }}
        >
          <div className="queue-item-left">
            <span className="queue-text" style={{ color: "var(--color-muted)" }}>LOG OUT</span>
          </div>
        </button>
      </main>
    </div>
  );
};

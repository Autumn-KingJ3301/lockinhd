import React, { useState } from "react";
import { useLockinStore } from "../store/useLockinStore";
import { useNavigate } from "react-router-dom";
import type { Archive } from "../types";

function formatArchiveDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    return "Today · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) {
    return "Yesterday · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Mini Preview Drawer ───────────────────────────────────────────────────────

const ArchiveDrawer: React.FC<{
  archive: Archive;
  onClose: () => void;
  onRestore: () => void;
}> = ({ archive, onClose, onRestore }) => (
  <div className="archive-drawer">
    <div className="archive-drawer-header">
      <span className="archive-drawer-title">{archive.label}</span>
      <button className="delete-btn" onClick={onClose}>×</button>
    </div>
    <div className="archive-drawer-body">
      {/* Sessions */}
      {archive.sessions.length > 0 && (
        <div className="archive-drawer-section">
          <div className="archive-drawer-section-label">
            SESSIONS · {archive.sessions.length}
          </div>
          {archive.sessions.map((s, i) => (
            <div key={i} className="archive-drawer-row">
              <span className="archive-drawer-index">{i + 1}</span>
              <span className="archive-drawer-text">{s.task}</span>
              {s.duration != null && (
                <span className="archive-drawer-meta">
                  {Math.round(s.duration / 60)}m
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Queue */}
      {archive.queue.length > 0 && (
        <div className="archive-drawer-section">
          <div className="archive-drawer-section-label">
            QUEUED · {archive.queue.length}
          </div>
          {archive.queue.map((q, i) => (
            <div key={i} className="archive-drawer-row">
              <span className="archive-drawer-index">{i + 1}</span>
              <span className="archive-drawer-text">{q.text}</span>
            </div>
          ))}
        </div>
      )}
      {/* Inbox */}
      {archive.idleSidetracks.length > 0 && (
        <div className="archive-drawer-section">
          <div className="archive-drawer-section-label">
            INBOX · {archive.idleSidetracks.length}
          </div>
          {archive.idleSidetracks.map((s, i) => (
            <div key={i} className="archive-drawer-row">
              <span className="archive-drawer-index">{i + 1}</span>
              <span className="archive-drawer-text">{s}</span>
            </div>
          ))}
        </div>
      )}
      <button className="archive-restore-btn" onClick={onRestore}>
        ↺ RESTORE THIS ARCHIVE
      </button>
    </div>
  </div>
);

// ─── Archive Confirm Bar ───────────────────────────────────────────────────────

export const ArchiveConfirmBar: React.FC = () => {
  const archiveConfirmPending = useLockinStore((s) => s.archiveConfirmPending);
  const setArchiveConfirmPending = useLockinStore((s) => s.setArchiveConfirmPending);
  const createArchive = useLockinStore((s) => s.createArchive);
  const setToastMsg = useLockinStore((s) => s.setToastMsg);
  const navigate = useNavigate();
  const sessions = useLockinStore((s) => s.sessions);
  const queue = useLockinStore((s) => s.queue);
  const idleSidetracks = useLockinStore((s) => s.idleSidetracks);

  if (!archiveConfirmPending) return null;

  const itemCount = sessions.length + queue.length + idleSidetracks.length;

  const handleConfirm = () => {
    setArchiveConfirmPending(false);
    createArchive();
    setToastMsg("Workspace archived! Starting fresh ✓");
  };

  return (
    <div className="archive-confirm-bar">
      <div className="archive-confirm-content">
        <span className="archive-confirm-icon">⊡</span>
        <div className="archive-confirm-text">
          <span className="archive-confirm-title">Archive workspace?</span>
          <span className="archive-confirm-sub">
            {itemCount} item{itemCount !== 1 ? "s" : ""} will be hidden · workspace will be empty after
          </span>
        </div>
      </div>
      <div className="archive-confirm-actions">
        <button
          id="archive-confirm-yes"
          className="archive-confirm-btn archive-confirm-btn-yes"
          onClick={handleConfirm}
        >
          ARCHIVE
        </button>
        <button
          id="archive-view-profile"
          className="archive-confirm-btn archive-confirm-btn-profile"
          onClick={() => { setArchiveConfirmPending(false); navigate("/profile"); }}
        >
          VIEW IN PROFILE
        </button>
        <button
          id="archive-confirm-cancel"
          className="archive-confirm-btn archive-confirm-btn-cancel"
          onClick={() => setArchiveConfirmPending(false)}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

// ─── Stash Notification Bar ────────────────────────────────────────────────────

export const StashNotifBar: React.FC = () => {
  const stash = useLockinStore((s) => s.stash);
  const popStash = useLockinStore((s) => s.popStash);
  const discardStash = useLockinStore((s) => s.discardStash);
  const setToastMsg = useLockinStore((s) => s.setToastMsg);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!stash) return null;

  const total = stash.sessions.length + stash.queue.length + stash.idleSidetracks.length;

  return (
    <div className="stash-notif-bar">
      <span className="stash-notif-icon">⟆</span>
      <span className="stash-notif-text">
        Stash active · {total} item{total !== 1 ? "s" : ""}
      </span>
      <div className="stash-notif-actions">
        <button
          id="stash-pop-notif"
          className="stash-notif-btn stash-notif-pop"
          onClick={() => { popStash(); setToastMsg("Stash popped!"); }}
        >
          ↑ POP
        </button>
        {confirmDiscard ? (
          <>
            <button
              id="stash-discard-confirm-notif"
              className="stash-notif-btn stash-notif-discard-confirm"
              onClick={() => { discardStash(); setConfirmDiscard(false); setToastMsg("Stash discarded."); }}
            >
              CONFIRM DISCARD
            </button>
            <button
              className="stash-notif-btn"
              onClick={() => setConfirmDiscard(false)}
            >
              CANCEL
            </button>
          </>
        ) : (
          <button
            id="stash-discard-notif"
            className="stash-notif-btn stash-notif-discard"
            onClick={() => setConfirmDiscard(true)}
          >
            ✕ DISCARD
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Archive Panel ────────────────────────────────────────────────────────

export const ArchivePanel: React.FC = () => {
  const archives = useLockinStore((s) => s.archives);
  const archivesLoading = useLockinStore((s) => s.archivesLoading);
  const restoreArchive = useLockinStore((s) => s.restoreArchive);
  const setToastMsg = useLockinStore((s) => s.setToastMsg);
  const navigate = useNavigate();

  const [openDrawer, setOpenDrawer] = useState<Archive | null>(null);

  const handleRestore = (archiveId: string) => {
    setOpenDrawer(null);
    const { stashCreated } = restoreArchive(archiveId);
    if (stashCreated) {
      setToastMsg("Restored! Previous workspace is now in stash.");
    } else {
      setToastMsg("Archive restored!");
    }
    navigate("/");
  };

  return (
    <div className="archive-panel panel-container">
      <header className="app-header">
        <div className="app-title">ARCHIVES</div>
        <div className="header-status">
          {archivesLoading ? (
            <span className="hint-text" style={{ fontSize: "10px" }}>loading…</span>
          ) : (
            <span className="session-count">{archives.length} snapshots</span>
          )}
        </div>
      </header>

      <div className="app-content">
        <div className="mode-container">
          {archives.length === 0 ? (
            <div className="empty-state" style={{ fontSize: "11px" }}>
              No archives yet.
              <br />
              <span style={{ opacity: 0.5 }}>Use /archive to snapshot your workspace.</span>
            </div>
          ) : (
            <div className="archive-timeline">
              {archives.map((archive, idx) => {
                const isOpen = openDrawer?.id === archive.id;
                return (
                  <div key={archive.id} className="archive-timeline-entry">
                    {/* Dot + connector */}
                    <div className="archive-timeline-track">
                      <div className={`archive-dot${idx === 0 ? " archive-dot-latest" : ""}`} />
                      {idx < archives.length - 1 && <div className="archive-connector" />}
                    </div>

                    {/* Card */}
                    <div className="archive-card-wrapper">
                      <div
                        className={`archive-card${isOpen ? " archive-card-open" : ""}`}
                        onClick={() => setOpenDrawer(isOpen ? null : archive)}
                      >
                        <div className="archive-card-main">
                          <div className="archive-card-label">
                            {archive.label}
                            {idx === 0 && (
                              <span className="archive-latest-badge">LATEST</span>
                            )}
                          </div>
                          <div className="archive-card-meta">
                            {formatArchiveDate(archive.createdAt)}
                          </div>
                        </div>
                        <div className="archive-card-counts">
                          <span>{archive.sessions.length}s</span>
                          <span>{archive.queue.length}q</span>
                          <span>{archive.idleSidetracks.length}i</span>
                        </div>
                      </div>

                      {/* Inline drawer */}
                      {isOpen && (
                        <ArchiveDrawer
                          archive={archive}
                          onClose={() => setOpenDrawer(null)}
                          onRestore={() => handleRestore(archive.id)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

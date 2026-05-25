import React from "react";
import type { JournalEntry } from "../../types";

interface JournalSidebarProps {
  journals: JournalEntry[];
  journalsLoading: boolean;
  activeEntryId?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  filteredEntries: JournalEntry[];
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  journalsLoading,
  activeEntryId,
  searchQuery,
  setSearchQuery,
  onSelectEntry,
  onDeleteEntry,
  filteredEntries,
}) => {
  return (
    <div className="journal-sidebar">
      <div className="journal-sidebar-header">
        <input
          type="text"
          className="journal-search-input"
          placeholder="Search reflections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="journal-list">
        {journalsLoading ? (
          <div className="empty-state" style={{ padding: "30px 0" }}>Loading...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state" style={{ padding: "30px 0", fontSize: "11px" }}>
            No reflection logs found
          </div>
        ) : (
          filteredEntries.map((j) => (
            <div
              key={j.id}
              className={`journal-list-item ${activeEntryId === j.id ? "active" : ""}`}
              onClick={() => onSelectEntry(j)}
            >
              <div className="journal-item-title">{j.title}</div>
              <div className="journal-item-meta">
                <span>{j.date}</span>
                <div className="journal-item-attachments">
                  {j.photos && j.photos.length > 0 && <span title={`${j.photos.length} photos`}>📷</span>}
                  {j.voiceMemos && j.voiceMemos.length > 0 && <span title={`${j.voiceMemos.length} voice recordings`}>🎙️</span>}
                </div>
              </div>
              <button
                className="journal-item-delete"
                onClick={(e) => onDeleteEntry(j.id, e)}
                title="Delete Entry"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

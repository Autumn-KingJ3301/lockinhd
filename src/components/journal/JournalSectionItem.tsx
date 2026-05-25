import React from "react";
import type { JournalSection } from "../../pages/Journal";

interface JournalSectionItemProps {
  section: JournalSection;
  idx: number;
  totalSections: number;
  newlyCreatedSectionId: string | null;
  updateSectionValue: (id: string, value: string) => void;
  toggleTodoSection: (id: string) => void;
  deleteSection: (id: string) => void;
  moveSection: (index: number, direction: "up" | "down") => void;
}

export const JournalSectionItem: React.FC<JournalSectionItemProps> = ({
  section,
  idx,
  totalSections,
  newlyCreatedSectionId,
  updateSectionValue,
  toggleTodoSection,
  deleteSection,
  moveSection,
}) => {
  const isAutoFocus = section.id === newlyCreatedSectionId;

  return (
    <div className="journal-section-item">
      <div className="section-drag-controls">
        <button
          className="section-control-btn"
          onClick={() => moveSection(idx, "up")}
          disabled={idx === 0}
          title="Move Up"
        >
          ▲
        </button>
        <button
          className="section-control-btn"
          onClick={() => moveSection(idx, "down")}
          disabled={idx === totalSections - 1}
          title="Move Down"
        >
          ▼
        </button>
        <button
          className="section-control-btn delete"
          onClick={() => deleteSection(section.id)}
          title="Delete block"
        >
          ×
        </button>
      </div>
      <div className="section-content-wrapper">
        {section.type === "heading" && (
          <input
            type="text"
            className="section-input-heading"
            value={section.value}
            onChange={(e) => updateSectionValue(section.id, e.target.value)}
            placeholder="Heading..."
            autoFocus={isAutoFocus}
          />
        )}
        {section.type === "text" && (
          <textarea
            className="section-input-textarea"
            value={section.value}
            onChange={(e) => updateSectionValue(section.id, e.target.value)}
            rows={Math.max(1, section.value.split("\n").length)}
            placeholder="Type reflections..."
            autoFocus={isAutoFocus}
          />
        )}
        {section.type === "todo" && (
          <div className="section-todo-row">
            <input
              type="checkbox"
              className="section-todo-checkbox"
              checked={!!section.completed}
              onChange={() => toggleTodoSection(section.id)}
            />
            <input
              type="text"
              className={`section-todo-text ${section.completed ? "completed" : ""}`}
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              placeholder="To-do item..."
              autoFocus={isAutoFocus}
            />
          </div>
        )}
        {section.type === "bullet" && (
          <div className="section-bullet-row">
            <span className="section-bullet-dot">•</span>
            <input
              type="text"
              className="section-bullet-text"
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              placeholder="Bullet point..."
              autoFocus={isAutoFocus}
            />
          </div>
        )}
        {section.type === "callout" && (
          <div className="section-callout-box">
            <span className="section-callout-emoji">💡</span>
            <textarea
              className="section-callout-text"
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              rows={Math.max(1, section.value.split("\n").length)}
              placeholder="Callout info..."
              autoFocus={isAutoFocus}
            />
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import type { JournalSection } from "../../pages/Journal";

interface JournalSectionItemProps {
  section: JournalSection;
  idx: number;
  totalSections: number;
  numberedIndex?: number;
  newlyCreatedSectionId: string | null;
  updateSectionValue: (id: string, value: string) => void;
  toggleTodoSection: (id: string) => void;
  deleteSection: (id: string) => void;
  moveSection: (index: number, direction: "up" | "down") => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  showSlashMenu?: boolean;
  slashMenuIndex?: number;
  slashMenuQuery?: string;
  onSelectCommand?: (type: JournalSection["type"]) => void;
}

const slashCommands = [
  { id: "text", label: "Text", desc: "Plain writing block", icon: "📝", command: "/text" },
  { id: "heading", label: "Heading", desc: "Big section title", icon: "🇭", command: "/heading" },
  { id: "todo", label: "Todo List", desc: "Task with checkbox", icon: "☑", command: "/todo" },
  { id: "bullet", label: "Bullet List", desc: "Simple bulleted list", icon: "•", command: "/bullet" },
  { id: "numbered", label: "Numbered List", desc: "Sequential items list", icon: "1️⃣", command: "/numbered" },
  { id: "quote", label: "Quote Box", desc: "Styled quote section", icon: "💬", command: "/quote" },
  { id: "code", label: "Code Snippet", desc: "Monospace code editor", icon: "💻", command: "/code" },
  { id: "divider", label: "Divider Line", desc: "Horizontal rule separator", icon: "➖", command: "/divider" },
  { id: "callout", label: "Callout Box", desc: "Highlight information", icon: "💡", command: "/callout" },
];

export const JournalSectionItem: React.FC<JournalSectionItemProps> = ({
  section,
  idx,
  numberedIndex,
  newlyCreatedSectionId,
  updateSectionValue,
  toggleTodoSection,
  onKeyDown,
  showSlashMenu,
  slashMenuIndex = 0,
  slashMenuQuery = "",
  onSelectCommand,
}) => {
  const isAutoFocus = section.id === newlyCreatedSectionId;

  // Callback ref to dynamically auto-height textarea elements based on scrollHeight
  const textareaRef = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const filteredCommands = slashCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(slashMenuQuery.toLowerCase()) ||
    cmd.command.toLowerCase().includes(slashMenuQuery.toLowerCase())
  );

  return (
    <div className="journal-section-item" style={{ padding: "4px 0" }}>
      <div className="section-content-wrapper" style={{ width: "100%" }}>
        {section.type === "heading" && (
          <input
            type="text"
            className="section-input-heading"
            value={section.value}
            onChange={(e) => updateSectionValue(section.id, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            data-section-id={section.id}
            placeholder="Heading..."
            autoFocus={isAutoFocus}
          />
        )}
        {section.type === "text" && (
          <textarea
            ref={textareaRef}
            rows={1}
            className="section-input-textarea"
            value={section.value}
            onChange={(e) => updateSectionValue(section.id, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            data-section-id={section.id}
            placeholder="Type reflections... (type / for commands)"
            autoFocus={isAutoFocus}
            style={{ overflowY: "hidden", resize: "none" }}
          />
        )}
        {section.type === "todo" && (
          <div className="section-todo-row" style={{ display: "flex", width: "100%" }}>
            <div 
              className={`custom-todo-checkbox ${section.completed ? "completed" : ""}`}
              onClick={() => toggleTodoSection(section.id)}
            >
              {section.completed ? "✓" : ""}
            </div>
            <input
              type="text"
              className={`section-todo-text ${section.completed ? "completed" : ""}`}
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              data-section-id={section.id}
              placeholder="To-do item..."
              autoFocus={isAutoFocus}
            />
          </div>
        )}
        {section.type === "bullet" && (
          <div className="section-bullet-row" style={{ display: "flex", width: "100%" }}>
            <span className="section-bullet-dot" style={{ userSelect: "none" }}>•</span>
            <input
              type="text"
              className="section-bullet-text"
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              data-section-id={section.id}
              placeholder="Bullet point..."
              autoFocus={isAutoFocus}
            />
          </div>
        )}
        {section.type === "quote" && (
          <textarea
            ref={textareaRef}
            rows={1}
            className="section-input-quote"
            value={section.value}
            onChange={(e) => updateSectionValue(section.id, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            data-section-id={section.id}
            placeholder="Quote..."
            autoFocus={isAutoFocus}
            style={{ overflowY: "hidden", resize: "none" }}
          />
        )}
        {section.type === "code" && (
          <textarea
            ref={textareaRef}
            rows={1}
            className="section-input-code"
            value={section.value}
            onChange={(e) => updateSectionValue(section.id, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            data-section-id={section.id}
            placeholder="// Paste code snippet here..."
            autoFocus={isAutoFocus}
            style={{ overflowY: "hidden", resize: "none" }}
          />
        )}
        {section.type === "divider" && (
          <div
            className="section-divider-wrapper"
            tabIndex={0}
            onKeyDown={(e) => onKeyDown(e, idx)}
            data-section-id={section.id}
            autoFocus={isAutoFocus}
          >
            <div className="section-divider-line" />
          </div>
        )}
        {section.type === "numbered" && (
          <div className="section-numbered-row" style={{ display: "flex", width: "100%" }}>
            <span className="section-numbered-index" style={{ userSelect: "none" }}>
              {numberedIndex ? `${numberedIndex}.` : "1."}
            </span>
            <input
              type="text"
              className="section-numbered-text"
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              data-section-id={section.id}
              placeholder="Numbered item..."
              autoFocus={isAutoFocus}
            />
          </div>
        )}
        {section.type === "callout" && (
          <div className="section-callout-box" style={{ display: "flex", width: "100%" }}>
            <span className="section-callout-emoji" style={{ userSelect: "none" }}>💡</span>
            <textarea
              ref={textareaRef}
              rows={1}
              className="section-callout-text"
              value={section.value}
              onChange={(e) => updateSectionValue(section.id, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              data-section-id={section.id}
              placeholder="Callout info..."
              autoFocus={isAutoFocus}
              style={{ overflowY: "hidden", resize: "none" }}
            />
          </div>
        )}

        {/* Autocomplete slash menu command popover */}
        {showSlashMenu && onSelectCommand && filteredCommands.length > 0 && (
          <div className="slash-menu-popover">
            {filteredCommands.map((cmd, i) => (
              <div
                key={cmd.id}
                className={`slash-menu-item ${i === slashMenuIndex ? "active" : ""}`}
                onClick={() => onSelectCommand(cmd.id as JournalSection["type"])}
              >
                <span className="slash-menu-icon">{cmd.icon}</span>
                <div className="slash-menu-info">
                  <div className="slash-menu-label">{cmd.label}</div>
                  <div className="slash-menu-desc">{cmd.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


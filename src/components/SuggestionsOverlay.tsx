import React from "react";

type SuggestionItem = {
  command: string;
  description: string;
};

type SuggestionsOverlayProps = {
  suggestions: SuggestionItem[];
  selectedIndex: number;
  onSelect: (command: string) => void;
};

export const SuggestionsOverlay: React.FC<SuggestionsOverlayProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
}) => {
  return (
    <div className="suggestions-overlay">
      {suggestions.map((item, idx) => (
        <div
          key={item.command}
          className={`suggestion-item ${idx === selectedIndex ? "active" : ""}`}
          onClick={() => onSelect(item.command)}
        >
          <span className="suggestion-command">{item.command}</span>
          <span className="suggestion-description">{item.description}</span>
        </div>
      ))}
    </div>
  );
};

import React from "react";
import { Note } from "../../types";
import { formatTimestamp } from "../../utils/timeFormatters";

interface NoteItemProps {
  note: Note;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note }) => (
  <div className="note-item">
    <span className="note-time">{formatTimestamp(note.ts)}</span>
    <span className="note-text">{note.text}</span>
  </div>
);

import React from "react";
import type { JournalEntry, JournalPhoto } from "../../types";

interface JournalAttachmentsProps {
  activeEntry: JournalEntry;
  loadedMedia: Record<string, string>;
  recording: boolean;
  recordTime: number;
  formatTimerLabel: (secs: number) => string;
  onAddPhotoClick: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePhoto: (photoId: string, e: React.MouseEvent) => void;
  onLightboxPhoto: (photo: JournalPhoto) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDeleteVoiceMemo: (memoId: string) => void;
  onVoiceLabelChange: (memoId: string, label: string) => void;
}

export const JournalAttachments: React.FC<JournalAttachmentsProps> = ({
  activeEntry,
  loadedMedia,
  recording,
  recordTime,
  formatTimerLabel,
  onAddPhotoClick,
  onPhotoUpload,
  onDeletePhoto,
  onLightboxPhoto,
  fileInputRef,
  onStartRecording,
  onStopRecording,
  onDeleteVoiceMemo,
  onVoiceLabelChange,
}) => {
  return (
    <div className="journal-attachments-sidebar">
      <div className="attachments-header">
        <span>MEDIA & ATTACHMENTS</span>
      </div>
      <div className="attachments-body">
        {/* Photo Upload Attachment */}
        <div className="attachments-group">
          <div className="photo-gallery-title">Attached Photos (Local Only)</div>
          <div className="photo-grid">
            {activeEntry.photos?.map((photo) => {
              const base64 = loadedMedia[photo.id];
              if (base64) {
                return (
                  <div
                    key={photo.id}
                    className="photo-card"
                    onClick={() => onLightboxPhoto(photo)}
                  >
                    <img src={base64} alt={photo.name} className="photo-img" />
                    <button
                      className="photo-delete-overlay"
                      onClick={(e) => onDeletePhoto(photo.id, e)}
                    >
                      ×
                    </button>
                  </div>
                );
              } else {
                return (
                  <div key={photo.id} className="photo-fallback-card" title={photo.name}>
                    📷 Local cache missing
                  </div>
                );
              }
            })}
            <div className="photo-card-placeholder" onClick={onAddPhotoClick}>
              +
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onPhotoUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Voice Reflections Recorder */}
        <div className="attachments-group">
          <div className="photo-gallery-title">Voice Reflections (Local Only)</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="voice-memo-recorder">
              <button
                className={`record-btn ${recording ? "recording" : ""}`}
                onClick={recording ? onStopRecording : onStartRecording}
                title={recording ? "Stop Recording" : "Record Memo"}
              >
                {recording ? "■" : "🎙️"}
              </button>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold" }}>
                  {recording ? "Recording..." : "Capture voice memo"}
                </span>
                <span className="hint-text">
                  {recording ? `Timer: ${formatTimerLabel(recordTime)}` : "Max 5 minutes recommended"}
                </span>
              </div>
            </div>

            {activeEntry.voiceMemos && activeEntry.voiceMemos.length > 0 && (
              <div className="voice-memo-list">
                {activeEntry.voiceMemos.map((memo) => {
                  const base64 = loadedMedia[memo.id];
                  return (
                    <div key={memo.id} className="voice-memo-item">
                      <div className="voice-memo-info">
                        <input
                          type="text"
                          className="voice-memo-label-input"
                          value={memo.label || ""}
                          onChange={(e) => onVoiceLabelChange(memo.id, e.target.value)}
                          placeholder="Memo label..."
                        />
                        {base64 ? (
                          <audio src={base64} controls className="voice-memo-player" />
                        ) : (
                          <div className="voice-memo-fallback">🎙️ Local memo missing</div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {memo.duration && (
                          <span className="hint-text">{formatTimerLabel(memo.duration)}</span>
                        )}
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteVoiceMemo(memo.id)}
                          title="Delete voice memo"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

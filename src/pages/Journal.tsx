import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { mediaDb } from "../utils/mediaDb";
import { formatSummaryDuration } from "../utils/timeFormatters";
import type { JournalEntry, JournalPhoto, Session } from "../types";

export const Journal: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  // Store state & actions
  const journals = useLockinStore((s) => s.journals);
  const journalsLoading = useLockinStore((s) => s.journalsLoading);
  const sessions = useLockinStore((s) => s.sessions);
  const idleSidetracks = useLockinStore((s) => s.idleSidetracks);
  const saveJournalEntry = useLockinStore((s) => s.saveJournalEntry);
  const deleteJournalEntry = useLockinStore((s) => s.deleteJournalEntry);
  const setToastMsg = useLockinStore((s) => s.setToastMsg);

  // Local component states
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [loadedMedia, setLoadedMedia] = useState<Record<string, string>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<JournalPhoto | null>(null);

  // Audio recording states
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordTimeRef = useRef(0);
  const recordingIntervalRef = useRef<any>(null);

  // Photo uploading states
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Esc key to go back home
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [navigate]);

  // Load media items from IndexedDB whenever the active entry changes
  useEffect(() => {
    if (!activeEntry) {
      setLoadedMedia({});
      return;
    }

    const loadMediaAssets = async () => {
      const assets: Record<string, string> = {};
      
      if (activeEntry.photos) {
        for (const photo of activeEntry.photos) {
          const base64 = await mediaDb.get(photo.id);
          if (base64) {
            assets[photo.id] = base64;
          }
        }
      }

      if (activeEntry.voiceMemos) {
        for (const memo of activeEntry.voiceMemos) {
          const base64 = await mediaDb.get(memo.id);
          if (base64) {
            assets[memo.id] = base64;
          }
        }
      }

      setLoadedMedia(assets);
    };

    loadMediaAssets();
  }, [activeEntry?.id]);

  // Cleanup audio recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Filter entries
  const filteredEntries = journals.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.date.includes(searchQuery)
  );

  // Create a new entry
  const handleNewEntry = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const existing = journals.find((j) => j.date === todayStr);

    if (existing) {
      setActiveEntry(existing);
      setToastMsg("Opened existing entry for today.");
      return;
    }

    // Auto-generate focus snapshots for today
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter(
      (s) => s.endTime && s.endTime >= todayTimestamp
    );

    const newEntry: JournalEntry = {
      id: "journal_" + Date.now(),
      createdAt: Date.now(),
      date: todayStr,
      title: `Reflections for ${new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
      content: "",
      sessionsSnapshot: todaySessions,
      idleSidetracksSnapshot: [...idleSidetracks],
      photos: [],
      voiceMemos: [],
    };

    setActiveEntry(newEntry);
  };

  // Sync / Snap current workspace sessions to active entry
  const handleRefreshSnapshot = () => {
    if (!activeEntry) return;

    // We assume the user wants to fetch sessions for the entry's selected date
    const selectedDateMidnight = new Date(activeEntry.date + "T00:00:00").getTime();
    const nextDateMidnight = selectedDateMidnight + 24 * 3600 * 1000;

    const daySessions = sessions.filter(
      (s) => s.endTime && s.endTime >= selectedDateMidnight && s.endTime < nextDateMidnight
    );

    const isToday = activeEntry.date === new Date().toISOString().split("T")[0];
    const daySidetracks = isToday ? [...idleSidetracks] : [];

    setActiveEntry({
      ...activeEntry,
      sessionsSnapshot: daySessions,
      idleSidetracksSnapshot: daySidetracks,
    });
    setToastMsg("Focus stats snapshot updated!");
  };

  // Save entry (local store + firebase)
  const handleSaveEntry = async () => {
    if (!activeEntry) return;
    if (!activeEntry.title.trim()) {
      setToastMsg("Journal title cannot be empty.");
      return;
    }

    await saveJournalEntry(activeEntry);
  };

  // Delete entry
  const handleDeleteEntry = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this reflection entry?")) {
      const entry = journals.find(j => j.id === id);
      if (entry) {
        // Clean up media files from IndexedDB
        if (entry.photos) {
          entry.photos.forEach((p) => mediaDb.delete(p.id));
        }
        if (entry.voiceMemos) {
          entry.voiceMemos.forEach((vm) => mediaDb.delete(vm.id));
        }
      }
      
      await deleteJournalEntry(id);
      if (activeEntry?.id === id) {
        setActiveEntry(null);
      }
    }
  };

  // Handle Photo Picker
  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEntry) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize using Canvas to keep size around 30-50KB
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const max_size = 800;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        const photoId = "photo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

        mediaDb.set(photoId, base64).then(() => {
          const updatedPhotos = [
            ...(activeEntry.photos || []),
            { id: photoId, name: file.name, hasLocalData: true },
          ];
          setActiveEntry({ ...activeEntry, photos: updatedPhotos });
          setLoadedMedia((prev) => ({ ...prev, [photoId]: base64 }));
          setToastMsg("Photo attached locally ✓");
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = "";
  };

  const handleDeletePhoto = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeEntry) return;

    mediaDb.delete(photoId).then(() => {
      const updatedPhotos = (activeEntry.photos || []).filter((p) => p.id !== photoId);
      setActiveEntry({ ...activeEntry, photos: updatedPhotos });
      setLoadedMedia((prev) => {
        const copy = { ...prev };
        delete copy[photoId];
        return copy;
      });
      setToastMsg("Photo attachment removed.");
    });
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const memoId = "voice_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

          await mediaDb.set(memoId, base64);
          
          const duration = recordTimeRef.current;
          const updatedMemos = [
            ...(activeEntry?.voiceMemos || []),
            {
              id: memoId,
              label: `Voice Reflection #${(activeEntry?.voiceMemos?.length || 0) + 1}`,
              duration,
              hasLocalData: true,
            },
          ];

          setActiveEntry((prev) => {
            if (!prev) return null;
            return { ...prev, voiceMemos: updatedMemos };
          });
          setLoadedMedia((prev) => ({ ...prev, [memoId]: base64 }));
          setToastMsg("Voice memo saved locally ✓");
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setRecordTime(0);
      recordTimeRef.current = 0;

      recordingIntervalRef.current = setInterval(() => {
        setRecordTime((prev) => {
          const next = prev + 1;
          recordTimeRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
      alert("Please allow microphone access to record voice reflections.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setRecording(false);
    setMediaRecorder(null);
  };

  const handleDeleteVoiceMemo = (memoId: string) => {
    if (!activeEntry) return;
    if (confirm("Delete this voice memo?")) {
      mediaDb.delete(memoId).then(() => {
        const updatedMemos = (activeEntry.voiceMemos || []).filter((vm) => vm.id !== memoId);
        setActiveEntry({ ...activeEntry, voiceMemos: updatedMemos });
        setLoadedMedia((prev) => {
          const copy = { ...prev };
          delete copy[memoId];
          return copy;
        });
      });
    }
  };

  const handleVoiceLabelChange = (memoId: string, label: string) => {
    if (!activeEntry) return;
    const updatedMemos = (activeEntry.voiceMemos || []).map((vm) =>
      vm.id === memoId ? { ...vm, label } : vm
    );
    setActiveEntry({ ...activeEntry, voiceMemos: updatedMemos });
  };

  // Helper formats
  const formatTimerLabel = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Focus snapshot summaries calculations
  const calculateTotalFocusTime = (sessionsList?: Session[]) => {
    if (!sessionsList) return 0;
    return sessionsList.reduce((acc, s) => acc + (s.duration || 0), 0);
  };

  return (
    <>
      <style>{`
        .journal-container {
          width: 100%;
          max-width: 900px;
          height: calc(100vh - 120px);
          min-height: 580px;
          background-color: var(--color-card-bg);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: var(--theme-border-radius, 12px);
          display: flex;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          overflow: hidden;
          transition: all 0.3s ease;
          animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .journal-sidebar {
          width: 300px;
          border-right: var(--theme-border-width, 0.5px) solid var(--color-border);
          background-color: var(--color-bg);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .journal-sidebar-header {
          padding: 16px;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .journal-search-input {
          width: 100%;
          padding: 8px 12px;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 6px;
          font-size: 12px;
          color: var(--color-text);
          outline: none;
        }

        .journal-search-input::placeholder {
          color: var(--color-muted);
          opacity: 0.6;
        }

        .journal-new-btn {
          width: 100%;
          padding: 10px;
          background-color: var(--color-success-bg);
          color: var(--color-success);
          border: 0.5px solid var(--color-success);
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .journal-new-btn:hover {
          background-color: var(--color-success);
          color: var(--color-bg);
        }

        .journal-list {
          flex-grow: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .journal-list-item {
          padding: 12px 14px;
          border-radius: 8px;
          border: 0.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        .journal-list-item:hover {
          background-color: var(--color-surface);
        }

        .journal-list-item.active {
          background-color: var(--color-accent-bg);
          border-color: var(--color-accent-border);
        }

        .journal-item-title {
          font-weight: 600;
          font-size: 12px;
          color: var(--color-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding-right: 18px;
        }

        .journal-item-meta {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-muted);
        }

        .journal-item-attachments {
          display: flex;
          gap: 4px;
        }

        .journal-item-delete {
          position: absolute;
          right: 10px;
          top: 12px;
          opacity: 0;
          transition: opacity 0.2s;
          background: none;
          border: none;
          color: var(--color-muted);
          cursor: pointer;
          font-size: 14px;
        }

        .journal-list-item:hover .journal-item-delete {
          opacity: 0.6;
        }

        .journal-list-item:hover .journal-item-delete:hover {
          opacity: 1;
          color: var(--color-panic);
        }

        .journal-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          background-color: var(--color-card-bg);
          overflow-y: auto;
        }

        .journal-empty-view {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          text-align: center;
          color: var(--color-muted);
          gap: 12px;
        }

        .journal-editor-header {
          padding: 20px;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .journal-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .journal-title-input {
          font-family: var(--font-sans);
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text);
          background: transparent;
          border: none;
          outline: none;
          flex-grow: 1;
          border-bottom: 1px solid transparent;
          padding-bottom: 2px;
          transition: border-bottom 0.2s;
        }

        .journal-title-input:focus {
          border-bottom-color: var(--color-accent-border);
        }

        .journal-save-btn {
          padding: 6px 14px;
          background-color: var(--color-accent-bg);
          color: var(--color-accent);
          border: 0.5px solid var(--color-accent-border);
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .journal-save-btn:hover {
          background-color: var(--color-accent);
          color: var(--color-bg);
        }

        .journal-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .journal-meta-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .journal-date-input {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-text);
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 4px;
          padding: 2px 6px;
          outline: none;
        }

        .sync-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          color: var(--color-muted);
        }

        .sync-badge.online {
          color: var(--color-success);
          background-color: var(--color-success-bg);
          border-color: var(--color-success);
        }

        .journal-editor-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-grow: 1;
        }

        .focus-snapshot-widget {
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 8px;
          background-color: var(--color-surface);
          overflow: hidden;
        }

        .snapshot-header {
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background-color: var(--color-bg);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-muted);
          letter-spacing: 0.05em;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
        }

        .snapshot-stats-row {
          display: flex;
          gap: 16px;
          padding: 12px 14px;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
          font-size: 11px;
          background-color: var(--color-card-bg);
        }

        .snapshot-stat-item {
          display: flex;
          flex-direction: column;
        }

        .snapshot-stat-val {
          font-weight: 700;
          color: var(--color-accent);
          font-size: 13px;
        }

        .snapshot-details-list {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 200px;
          overflow-y: auto;
          background-color: var(--color-card-bg);
        }

        .snapshot-detail-item {
          border-left: 2px solid var(--color-accent-border);
          padding-left: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .snapshot-detail-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .snapshot-detail-notes {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-muted);
          margin-top: 2px;
        }

        .journal-textarea {
          width: 100%;
          min-height: 180px;
          flex-grow: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 14px;
          line-height: 1.6;
          resize: none;
        }

        .journal-textarea::placeholder {
          color: var(--color-muted);
          opacity: 0.5;
        }

        .journal-media-section {
          border-top: var(--theme-border-width, 0.5px) solid var(--color-border);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .photo-gallery-title {
          font-size: 10px;
          font-weight: 600;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }

        .photo-card {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          background-color: var(--color-surface);
        }

        .photo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-delete-overlay {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: rgba(9, 9, 11, 0.6);
          color: #fff;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .photo-card:hover .photo-delete-overlay {
          opacity: 1;
        }

        .photo-card-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 6px;
          border: var(--theme-border-width, 0.5px) dashed var(--color-border);
          color: var(--color-muted);
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .photo-card-placeholder:hover {
          border-color: var(--color-accent-border);
          color: var(--color-text);
        }

        .photo-fallback-card {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          border: 0.5px solid var(--color-border);
          background-color: var(--color-surface);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-muted);
          font-size: 8px;
          text-align: center;
          padding: 4px;
          word-break: break-word;
        }

        .voice-memo-recorder {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          padding: 10px 14px;
          border-radius: 8px;
        }

        .record-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background-color: var(--color-panic);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          position: relative;
        }

        .record-btn.recording {
          animation: recordPulse 1.2s infinite ease-in-out;
        }

        @keyframes recordPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .voice-memo-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .voice-memo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 6px;
          border: 0.5px solid var(--color-border);
          background-color: var(--color-surface);
        }

        .voice-memo-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 4px;
        }

        .voice-memo-label-input {
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          border-bottom: 1px solid transparent;
        }

        .voice-memo-label-input:focus {
          border-bottom-color: var(--color-accent-border);
        }

        .voice-memo-player {
          height: 24px;
          margin-top: 4px;
          max-width: 200px;
        }

        .voice-memo-fallback {
          font-size: 10px;
          color: var(--color-muted);
          font-style: italic;
          margin-top: 4px;
        }

        /* Lightbox Modal */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(9, 9, 11, 0.95);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 24px;
          animation: fadeIn 0.2s ease-out forwards;
        }

        .lightbox-img {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 28px;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .lightbox-close:hover {
          opacity: 1;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {lightboxPhoto && (
        <div className="lightbox-overlay" onClick={() => setLightboxPhoto(null)}>
          <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>×</button>
          <img
            src={loadedMedia[lightboxPhoto.id]}
            alt={lightboxPhoto.name}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ color: "#a1a1aa", fontSize: "12px", marginTop: "12px", fontFamily: "var(--font-mono)" }}>
            {lightboxPhoto.name}
          </div>
        </div>
      )}

      {/* Main Journal Dashboard Header */}
      <header className="app-header" style={{ width: "100%", maxWidth: "900px" }}>
        <div className="app-title">DAILY FOCUS JOURNAL</div>
        <button
          className="delete-btn"
          onClick={() => navigate("/")}
          title="Back to App"
          style={{ fontSize: "16px" }}
        >
          ×
        </button>
      </header>

      {/* Main Dashboard Layout */}
      <div className="journal-container">
        {/* Sidebar */}
        <div className="journal-sidebar">
          <div className="journal-sidebar-header">
            <button className="journal-new-btn" onClick={handleNewEntry}>
              <span>+</span> NEW REFLECTION
            </button>
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
                  className={`journal-list-item ${activeEntry?.id === j.id ? "active" : ""}`}
                  onClick={() => setActiveEntry(j)}
                >
                  <div className="journal-item-title">{j.title}</div>
                  <div className="journal-item-meta">
                    <span>{j.date}</span>
                    <div className="journal-item-attachments">
                      {(j.photos && j.photos.length > 0) && <span title={`${j.photos.length} photos`}>📷</span>}
                      {(j.voiceMemos && j.voiceMemos.length > 0) && <span title={`${j.voiceMemos.length} voice recordings`}>🎙️</span>}
                    </div>
                  </div>
                  <button
                    className="journal-item-delete"
                    onClick={(e) => handleDeleteEntry(j.id, e)}
                    title="Delete Entry"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Pane */}
        <div className="journal-content">
          {!activeEntry ? (
            <div className="journal-empty-view">
              <span style={{ fontSize: "28px" }}>📝</span>
              <div className="task-name-large" style={{ margin: 0 }}>Reflection Hub</div>
              <div className="hint-text" style={{ maxWidth: "260px" }}>
                Select an entry from the sidebar or click "+ New Reflection" to review focus logs and reflect on your flow.
              </div>
            </div>
          ) : (
            <>
              {/* Header Editor bar */}
              <div className="journal-editor-header">
                <div className="journal-title-row">
                  <input
                    type="text"
                    className="journal-title-input"
                    value={activeEntry.title}
                    onChange={(e) => setActiveEntry({ ...activeEntry, title: e.target.value })}
                    placeholder="Reflection title..."
                  />
                  <button className="journal-save-btn" onClick={handleSaveEntry}>
                    SAVE ENTRY
                  </button>
                </div>
                <div className="journal-meta-row">
                  <div className="journal-meta-left">
                    <input
                      type="date"
                      className="journal-date-input"
                      value={activeEntry.date}
                      onChange={(e) => setActiveEntry({ ...activeEntry, date: e.target.value })}
                    />
                    <span className={`sync-badge ${user ? "online" : ""}`}>
                      {user ? "Cloud Synced" : "Local Storage Draft"}
                    </span>
                  </div>
                  <button
                    className="theme-toggle-btn"
                    onClick={handleRefreshSnapshot}
                    style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
                  >
                    Refresh Snapshot
                  </button>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="journal-editor-body">
                {/* Expandable Auto Summary section */}
                <div className="focus-snapshot-widget">
                  <div
                    className="snapshot-header"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  >
                    <span>📊 AUTOMATIC FOCUS SNAPSHOT — {activeEntry.date}</span>
                    <span>{isSummaryExpanded ? "▲ HIDE" : "▼ SHOW"}</span>
                  </div>

                  {isSummaryExpanded && (
                    <>
                      <div className="snapshot-stats-row">
                        <div className="snapshot-stat-item">
                          <span className="hint-text" style={{ fontSize: "8px" }}>FOCUS SESSIONS</span>
                          <span className="snapshot-stat-val">
                            {activeEntry.sessionsSnapshot?.length || 0}
                          </span>
                        </div>
                        <div className="snapshot-stat-item">
                          <span className="hint-text" style={{ fontSize: "8px" }}>TOTAL FOCUS TIME</span>
                          <span className="snapshot-stat-val">
                            {formatSummaryDuration(calculateTotalFocusTime(activeEntry.sessionsSnapshot))}
                          </span>
                        </div>
                        <div className="snapshot-stat-item">
                          <span className="hint-text" style={{ fontSize: "8px" }}>CAPTURED SIDETRACKS</span>
                          <span className="snapshot-stat-val">
                            {activeEntry.idleSidetracksSnapshot?.length || 0}
                          </span>
                        </div>
                      </div>

                      <div className="snapshot-details-list">
                        {!activeEntry.sessionsSnapshot || activeEntry.sessionsSnapshot.length === 0 ? (
                          <div className="hint-text" style={{ padding: "8px 0" }}>
                            No sessions completed on this date. Use "Refresh Snapshot" to pull current data.
                          </div>
                        ) : (
                          activeEntry.sessionsSnapshot.map((s, idx) => (
                            <div key={idx} className="snapshot-detail-item">
                              <span className="snapshot-detail-title">
                                {idx + 1}. {s.task} ({formatSummaryDuration(s.duration || 0)})
                              </span>
                              {s.notes && s.notes.length > 0 && (
                                <div className="snapshot-detail-notes">
                                  {s.notes.map((n, i) => (
                                    <div key={i}>
                                      • {n.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {s.sidetracks && s.sidetracks.length > 0 && (
                                <div className="snapshot-detail-notes" style={{ color: "var(--color-accent)" }}>
                                  {s.sidetracks.map((st, i) => (
                                    <div key={i}>
                                      💡 Sidetrack: {st}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {activeEntry.idleSidetracksSnapshot && activeEntry.idleSidetracksSnapshot.length > 0 && (
                          <div className="snapshot-detail-item" style={{ borderLeftColor: "var(--color-muted)" }}>
                            <span className="snapshot-detail-title" style={{ color: "var(--color-muted)" }}>
                              Braindump Sidetracks
                            </span>
                            <div className="snapshot-detail-notes">
                              {activeEntry.idleSidetracksSnapshot.map((st, i) => (
                                <div key={i}>
                                  💡 {st}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Main Reflection textarea */}
                <textarea
                  className="journal-textarea"
                  value={activeEntry.content}
                  onChange={(e) => setActiveEntry({ ...activeEntry, content: e.target.value })}
                  placeholder="Reflect on your focus flow today. What triggered sidetracks? What went well? How was your energy?"
                />

                {/* Media Section */}
                <div className="journal-media-section">
                  {/* Photo Upload Attachment */}
                  <div>
                    <div className="photo-gallery-title" style={{ marginBottom: "8px" }}>
                      Attached Photos (Local Only)
                    </div>
                    <div className="photo-grid">
                      {activeEntry.photos?.map((photo) => {
                        const base64 = loadedMedia[photo.id];
                        if (base64) {
                          return (
                            <div
                              key={photo.id}
                              className="photo-card"
                              onClick={() => setLightboxPhoto(photo)}
                            >
                              <img src={base64} alt={photo.name} className="photo-img" />
                              <button
                                className="photo-delete-overlay"
                                onClick={(e) => handleDeletePhoto(photo.id, e)}
                              >
                                ×
                              </button>
                            </div>
                          );
                        } else {
                          // Cached photo content missing (different device or cache wiped)
                          return (
                            <div key={photo.id} className="photo-fallback-card" title={photo.name}>
                              📷 Local cache missing
                            </div>
                          );
                        }
                      })}
                      <div className="photo-card-placeholder" onClick={handleAddPhotoClick}>
                        +
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>

                  {/* Voice Reflections Recorder */}
                  <div>
                    <div className="photo-gallery-title" style={{ marginBottom: "8px" }}>
                      Voice Reflections (Local Only)
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className="voice-memo-recorder">
                        <button
                          className={`record-btn ${recording ? "recording" : ""}`}
                          onClick={recording ? stopRecording : startRecording}
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
                                    onChange={(e) => handleVoiceLabelChange(memo.id, e.target.value)}
                                    placeholder="Memo label..."
                                  />
                                  {base64 ? (
                                    <audio
                                      src={base64}
                                      controls
                                      className="voice-memo-player"
                                    />
                                  ) : (
                                    <div className="voice-memo-fallback">
                                      🎙️ Local memo missing
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {memo.duration && (
                                    <span className="hint-text">{formatTimerLabel(memo.duration)}</span>
                                  )}
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteVoiceMemo(memo.id)}
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
            </>
          )}
        </div>
      </div>

      {/* Floating status display to notify about image limitation */}
      <div
        className="hint-text"
        style={{
          width: "100%",
          maxWidth: "900px",
          textAlign: "center",
          marginTop: "12px",
          opacity: 0.7,
        }}
      >
        💡 Notice: Image and audio files are stored in your device's browser cache only. Reflections text, titles, dates, and stats are saved on the cloud.
      </div>
    </>
  );
};

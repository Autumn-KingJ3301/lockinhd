import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { mediaDb } from "../utils/mediaDb";
import type { JournalEntry, JournalPhoto, Session } from "../types";

// Subcomponents
import { FocusBlueprint } from "../components/journal/FocusBlueprint";
import { JournalSectionItem } from "../components/journal/JournalSectionItem";
import { JournalSidebar } from "../components/journal/JournalSidebar";
import { JournalAttachments } from "../components/journal/JournalAttachments";

export interface JournalSection {
  id: string;
  type: "text" | "heading" | "todo" | "callout" | "bullet";
  value: string;
  completed?: boolean;
}

const parseJournalContent = (content: string): JournalSection[] => {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.every(item => item && typeof item === 'object' && 'id' in item && 'type' in item)) {
      return parsed;
    }
  } catch (e) {
    // Not JSON
  }
  return [
    {
      id: "section_default",
      type: "text",
      value: content || "",
    }
  ];
};

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

  // Active session details for real-time stats
  const activeSession = useLockinStore((s) => s.session);
  const elapsed = useLockinStore((s) => s.elapsed);

  // Local component states
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedMedia, setLoadedMedia] = useState<Record<string, string>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<JournalPhoto | null>(null);
  
  // Notion-style sections state
  const [sections, setSections] = useState<JournalSection[]>([]);
  const [newlyCreatedSectionId, setNewlyCreatedSectionId] = useState<string | null>(null);

  // Audio recording states
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recordTimeRef = useRef(0);
  const recordingIntervalRef = useRef<any>(null);

  // Tactile save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  // Parse content into sections when loading a different entry
  useEffect(() => {
    if (activeEntry) {
      setSections(parseJournalContent(activeEntry.content));
    } else {
      setSections([]);
    }
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

  // Auto-creation / Load today's reflection on mount
  useEffect(() => {
    if (journalsLoading) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const existing = journals.find((j) => j.date === todayStr);

    if (existing) {
      if (!activeEntry) {
        setActiveEntry(existing);
      }
    } else {
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
        sessionsSnapshot: [],
        idleSidetracksSnapshot: [],
        photos: [],
        voiceMemos: [],
      };

      // Save instantly to store
      saveJournalEntry(newEntry);
      setActiveEntry(newEntry);
      setToastMsg("Journal automatically created for today!");
    }
  }, [journalsLoading, journals, activeEntry]);

  // Enforce single reflection entry per day on date picker change
  const handleDateChange = (newDate: string) => {
    if (!activeEntry) return;

    const duplicate = journals.find((j) => j.date === newDate && j.id !== activeEntry.id);
    if (duplicate) {
      setToastMsg("An entry already exists for this date!");
      return;
    }

    setActiveEntry({ ...activeEntry, date: newDate });
  };

  // Dynamically compute focus sessions snapshot for a date
  const getSessionsForDate = (dateStr: string): Session[] => {
    const selectedDateMidnight = new Date(dateStr + "T00:00:00").getTime();
    const nextDateMidnight = selectedDateMidnight + 24 * 3600 * 1000;

    // Filter completed sessions for this date range
    const completedSessions = sessions.filter(
      (s) => s.endTime && s.endTime >= selectedDateMidnight && s.endTime < nextDateMidnight
    );

    // If it's today and a session is active, append it
    const todayStr = new Date().toISOString().split("T")[0];
    const daySessions = [...completedSessions];
    if (dateStr === todayStr && activeSession) {
      daySessions.push({
        ...activeSession,
        duration: elapsed,
      });
    }

    return daySessions;
  };

  // Dynamically compute focus sidetracks snapshot for a date
  const getSidetracksForDate = (dateStr: string): string[] => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr === todayStr) {
      return [...idleSidetracks];
    }
    return activeEntry?.idleSidetracksSnapshot || [];
  };

  // Check if activeEntry has unsaved edits
  const hasChanges = () => {
    if (!activeEntry) return false;
    const original = journals.find(j => j.id === activeEntry.id);
    if (!original) return true; // Newly created or unsaved draft

    return (
      activeEntry.title !== original.title ||
      activeEntry.date !== original.date ||
      activeEntry.content !== original.content
    );
  };

  // Save entry (local store + firebase) with tactile state transitions
  const handleSaveEntry = async () => {
    if (!activeEntry) return;
    if (!activeEntry.title.trim()) {
      setToastMsg("Journal title cannot be empty.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    // Snapshot the current daily work into the record when saving
    const entryToSave: JournalEntry = {
      ...activeEntry,
      sessionsSnapshot: getSessionsForDate(activeEntry.date),
      idleSidetracksSnapshot: getSidetracksForDate(activeEntry.date),
    };

    // Save
    await saveJournalEntry(entryToSave);

    // Simulation delay for tactile feel
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Update our local state to match saved snapshot to prevent showing changes
      setActiveEntry(entryToSave);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    }, 600);
  };

  // Delete entry
  const handleDeleteEntry = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm("Are you sure you want to delete this reflection entry?")) {
      const entry = journals.find(j => j.id === id);
      if (entry) {
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

  // Sections management helper
  const handleUpdateSections = (newSections: JournalSection[]) => {
    setSections(newSections);
    if (activeEntry) {
      setActiveEntry({
        ...activeEntry,
        content: JSON.stringify(newSections)
      });
    }
  };

  const updateSectionValue = (id: string, value: string) => {
    const newSections = sections.map(s => s.id === id ? { ...s, value } : s);
    handleUpdateSections(newSections);
  };

  const toggleTodoSection = (id: string) => {
    const newSections = sections.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    handleUpdateSections(newSections);
  };

  const deleteSection = (id: string) => {
    const newSections = sections.filter(s => s.id !== id);
    handleUpdateSections(newSections);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    handleUpdateSections(newSections);
  };

  const addSection = (type: JournalSection["type"]) => {
    const newId = "sec_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const newSection: JournalSection = {
      id: newId,
      type,
      value: "",
      completed: type === "todo" ? false : undefined
    };
    const newSections = [...sections, newSection];
    setNewlyCreatedSectionId(newId);
    handleUpdateSections(newSections);
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

  return (
    <>
      <style>{`
        .journal-container {
          width: 100%;
          max-width: 1400px;
          height: calc(100vh - 120px);
          min-height: 600px;
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
          width: 280px;
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
          font-size: 20px;
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
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
        }

        .journal-save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .journal-save-btn:hover:not(:disabled) {
          background-color: var(--color-accent);
          color: var(--color-bg);
          transform: scale(1.03);
        }

        .journal-save-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .journal-save-btn.success {
          background-color: var(--color-success-bg);
          color: var(--color-success);
          border-color: var(--color-success);
          animation: popSuccess 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popSuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
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
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-grow: 1;
        }

        /* Focus Blueprint styles (Non-collapsible integrated section) */
        .focus-blueprint-section {
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 10px;
          background-color: var(--color-surface);
          overflow: hidden;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .focus-blueprint-header {
          padding: 12px 16px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-accent);
          background-color: var(--color-accent-bg);
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
        }

        .snapshot-narrative-box {
          padding: 16px;
          border-bottom: var(--theme-border-width, 0.5px) dashed var(--color-border);
          font-size: 13px;
          line-height: 1.6;
          color: var(--color-text);
        }

        .snapshot-narrative-box p {
          margin: 0;
          opacity: 0.9;
        }

        .snapshot-narrative-box strong {
          color: var(--color-accent);
          font-weight: 700;
        }

        .snapshot-details-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 300px;
          overflow-y: auto;
          background-color: var(--color-card-bg);
        }

        .artifact-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        .artifact-node {
          display: flex;
          gap: 16px;
          position: relative;
        }

        .artifact-line {
          position: absolute;
          left: 15px;
          top: 32px;
          bottom: -24px;
          width: 1px;
          background-color: var(--color-border);
        }

        .artifact-node:last-child .artifact-line {
          display: none;
        }

        .artifact-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--color-card-bg);
          border: 1px solid var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-accent);
          z-index: 1;
          flex-shrink: 0;
          box-shadow: 0 0 10px var(--color-accent-bg);
        }

        .artifact-node-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 4px;
          flex-grow: 1;
        }

        .artifact-node-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
        }

        .artifact-node-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-text);
        }

        .artifact-node-duration {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: var(--color-muted);
        }

        .active-pulsing {
          color: var(--color-success);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .active-pulsing::before {
          content: "";
          display: inline-block;
          width: 6px;
          height: 6px;
          background-color: var(--color-success);
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }

        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.1); }
        }

        .artifact-notes-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 2px;
        }

        .artifact-note-bubble {
          background-color: var(--color-surface);
          border: 0.5px solid var(--color-border);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--color-text);
          font-style: italic;
          opacity: 0.95;
          position: relative;
        }

        .artifact-tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .artifact-todo-tag {
          font-size: 10.5px;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-sans);
          font-weight: 500;
        }

        .artifact-todo-tag.completed {
          background-color: var(--color-success-bg);
          border: 0.5px solid var(--color-success);
          color: var(--color-success);
        }

        .artifact-todo-tag.pending {
          background-color: var(--color-surface);
          border: 0.5px solid var(--color-border);
          color: var(--color-muted);
          opacity: 0.8;
        }

        .artifact-sidetrack-badge {
          font-size: 10.5px;
          padding: 2px 8px;
          border-radius: 4px;
          background-color: rgba(245, 158, 11, 0.08);
          border: 0.5px solid rgba(245, 158, 11, 0.3);
          color: var(--color-accent);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* Notion-style Document Sections */
        .journal-sections-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
          flex-grow: 1;
        }

        .journal-section-item {
          display: flex;
          align-items: flex-start;
          position: relative;
          gap: 8px;
          padding: 6px 0;
          width: 100%;
        }

        .section-drag-controls {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
          align-items: center;
          margin-top: 4px;
          user-select: none;
        }

        .journal-section-item:hover .section-drag-controls {
          opacity: 1;
        }

        .section-control-btn {
          background: none;
          border: none;
          color: var(--color-muted);
          cursor: pointer;
          font-size: 11px;
          padding: 2px 4px;
          border-radius: 3px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .section-control-btn:disabled {
          opacity: 0.2;
          cursor: not-allowed;
        }

        .section-control-btn:hover:not(:disabled) {
          background-color: var(--color-surface);
          color: var(--color-text);
        }

        .section-control-btn.delete:hover {
          color: var(--color-panic);
          background-color: rgba(239, 68, 68, 0.1);
        }

        .section-content-wrapper {
          flex-grow: 1;
          display: flex;
          align-items: flex-start;
          width: 100%;
        }

        /* Block textareas and inputs */
        .section-input-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.65;
          resize: none;
          padding: 2px 0;
          border-left: 2px solid transparent;
          padding-left: 6px;
        }

        .section-input-textarea:focus {
          border-left-color: var(--color-accent-border);
        }

        .section-input-textarea::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        .section-input-heading {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 18px;
          font-weight: 700;
          padding: 4px 0;
          border-left: 2px solid transparent;
          padding-left: 6px;
        }

        .section-input-heading:focus {
          border-left-color: var(--color-accent-border);
        }

        .section-input-heading::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        /* Todo block */
        .section-todo-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          padding-left: 6px;
        }

        .section-todo-checkbox {
          margin-top: 5px;
          cursor: pointer;
          accent-color: var(--color-accent);
          width: 15px;
          height: 15px;
        }

        .section-todo-text {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.6;
          border-left: 2px solid transparent;
        }

        .section-todo-text:focus {
          border-left-color: var(--color-accent-border);
        }

        .section-todo-text.completed {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .section-todo-text::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        /* Bullet block */
        .section-bullet-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          padding-left: 6px;
        }

        .section-bullet-dot {
          color: var(--color-accent);
          font-size: 16px;
          line-height: 1;
          margin-top: 3px;
          user-select: none;
        }

        .section-bullet-text {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.6;
          border-left: 2px solid transparent;
        }

        .section-bullet-text:focus {
          border-left-color: var(--color-accent-border);
        }

        .section-bullet-text::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        /* Callout block */
        .section-callout-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-left: 3px solid var(--color-accent);
          border-radius: 8px;
          padding: 12px;
          margin: 4px 6px;
        }

        .section-callout-emoji {
          font-size: 16px;
          line-height: 1;
          margin-top: 2px;
          user-select: none;
        }

        .section-callout-text {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.6;
          resize: none;
          padding: 0;
        }

        .section-callout-text::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        /* Block Toolbar */
        .block-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          border-top: var(--theme-border-width, 0.5px) dashed var(--color-border);
          margin-top: 24px;
          background-color: var(--color-surface);
          border-radius: 8px;
        }

        .toolbar-block-btn {
          padding: 6px 12px;
          background-color: var(--color-card-bg);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
        }

        .toolbar-block-btn:hover {
          background-color: var(--color-accent-bg);
          border-color: var(--color-accent-border);
          color: var(--color-accent);
          transform: translateY(-1px);
        }

        /* Attachments Right Sidebar styles */
        .journal-attachments-sidebar {
          width: 320px;
          border-left: var(--theme-border-width, 0.5px) solid var(--color-border);
          background-color: var(--color-bg);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow-y: auto;
        }

        .attachments-header {
          padding: 16px;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .attachments-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .attachments-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .photo-gallery-title {
          font-size: 10px;
          font-weight: 700;
          color: var(--color-muted);
          letter-spacing: 0.08em;
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
          overflow: hidden;
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
          width: 100%;
        }

        .voice-memo-label-input:focus {
          border-bottom-color: var(--color-accent-border);
        }

        .voice-memo-player {
          height: 24px;
          margin-top: 4px;
          max-width: 180px;
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
      <header className="app-header" style={{ width: "100%", maxWidth: "1400px" }}>
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
        {/* Sidebar (Subcomponent) */}
        <JournalSidebar
          journals={journals}
          journalsLoading={journalsLoading}
          activeEntryId={activeEntry?.id}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectEntry={setActiveEntry}
          onDeleteEntry={handleDeleteEntry}
          filteredEntries={filteredEntries}
        />

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
                  
                  {/* Save button only appears if there is a change in the journal */}
                  {hasChanges() && (
                    <button 
                      className={`journal-save-btn ${saveSuccess ? "success" : ""}`} 
                      onClick={handleSaveEntry}
                      disabled={isSaving}
                    >
                      {isSaving ? "SAVING..." : saveSuccess ? "✓ SAVED" : "SAVE ENTRY"}
                    </button>
                  )}
                </div>
                <div className="journal-meta-row">
                  <div className="journal-meta-left">
                    <input
                      type="date"
                      className="journal-date-input"
                      value={activeEntry.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                    <span className={`sync-badge ${user ? "online" : ""}`}>
                      {user ? "Cloud Synced" : "Local Storage Draft"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="journal-editor-body">
                {/* Integrated Focus Blueprint section (Subcomponent) */}
                <FocusBlueprint
                  sessionsSnapshot={getSessionsForDate(activeEntry.date)}
                  idleSidetracksSnapshot={getSidetracksForDate(activeEntry.date)}
                  date={activeEntry.date}
                />

                {/* Notion-style sections list */}
                <div className="journal-sections-container">
                  {sections.length === 0 ? (
                    <div className="hint-text" style={{ padding: "20px 0", textAlign: "center" }}>
                      Click on the blocks below to start writing your reflections.
                    </div>
                  ) : (
                    sections.map((section, idx) => (
                      <JournalSectionItem
                        key={section.id}
                        section={section}
                        idx={idx}
                        totalSections={sections.length}
                        newlyCreatedSectionId={newlyCreatedSectionId}
                        updateSectionValue={updateSectionValue}
                        toggleTodoSection={toggleTodoSection}
                        deleteSection={deleteSection}
                        moveSection={moveSection}
                      />
                    ))
                  )}
                  
                  {/* Block Actions Toolbar */}
                  <div className="block-toolbar">
                    <button className="toolbar-block-btn" onClick={() => addSection("text")}>
                      📝 Text Block
                    </button>
                    <button className="toolbar-block-btn" onClick={() => addSection("heading")}>
                      🇭 Heading Block
                    </button>
                    <button className="toolbar-block-btn" onClick={() => addSection("todo")}>
                      ☑ Checkbox Block
                    </button>
                    <button className="toolbar-block-btn" onClick={() => addSection("bullet")}>
                      • Bullet Block
                    </button>
                    <button className="toolbar-block-btn" onClick={() => addSection("callout")}>
                      💡 Callout Box
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Attachments Sidebar (Right Sidebar) (Subcomponent) */}
        {activeEntry && (
          <JournalAttachments
            activeEntry={activeEntry}
            loadedMedia={loadedMedia}
            recording={recording}
            recordTime={recordTime}
            formatTimerLabel={formatTimerLabel}
            onAddPhotoClick={handleAddPhotoClick}
            onPhotoUpload={handlePhotoUpload}
            onDeletePhoto={handleDeletePhoto}
            onLightboxPhoto={setLightboxPhoto}
            fileInputRef={fileInputRef}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onDeleteVoiceMemo={handleDeleteVoiceMemo}
            onVoiceLabelChange={handleVoiceLabelChange}
          />
        )}
      </div>

      {/* Floating status display to notify about image limitation */}
      <div
        className="hint-text"
        style={{
          width: "100%",
          maxWidth: "1400px",
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

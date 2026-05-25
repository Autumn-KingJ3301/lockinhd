import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLockinStore } from "../store/useLockinStore";
import { useAuthStore } from "../store/useAuthStore";
import { useWindDownStore } from "../store/useWindDownStore";
import { mediaDb } from "../utils/mediaDb";
import type { JournalEntry, JournalPhoto, Session } from "../types";

// Subcomponents
import { JournalSectionItem } from "../components/journal/JournalSectionItem";
import { JournalSidebar } from "../components/journal/JournalSidebar";
import { JournalAttachments } from "../components/journal/JournalAttachments";
import { FocusAnalytics } from "../components/journal/FocusAnalytics";

export interface JournalSection {
  id: string;
  type: "text" | "heading" | "todo" | "callout" | "bullet" | "quote" | "code" | "divider" | "numbered";
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
  const [activeTab, setActiveTab] = useState<"editor" | "analytics">("editor");
  const [showHistory, setShowHistory] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [slashMenu, setSlashMenu] = useState<{ sectionId: string; query: string; index: number; } | null>(null);
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [activeTone, setActiveTone] = useState<string>("minimalist");

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

  // Programmatic focus effect for Notion blocks
  useEffect(() => {
    if (newlyCreatedSectionId) {
      const el = document.querySelector(`[data-section-id="${newlyCreatedSectionId}"]`) as HTMLElement | null;
      if (el) {
        el.focus();
        // Move selection cursor to the end of the text if it's an input/textarea
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const len = el.value.length;
          if (el.setSelectionRange) {
            el.setSelectionRange(len, len);
          }
        }
      }
    }
  }, [newlyCreatedSectionId]);

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

  // Mount effect auto-creation was moved lower in the file to resolve declaration dependencies

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

  // Dynamically compute wind-down logs snapshot for a date
  const getWindDownForDate = (dateStr: string) => {
    const selectedDateMidnight = new Date(dateStr + "T00:00:00").getTime();
    const nextDateMidnight = selectedDateMidnight + 24 * 3600 * 1000;

    const allWindDownLogs = useWindDownStore.getState().windDownLogs;
    const completedLogs = allWindDownLogs.filter(
      (wd) => wd.endTime >= selectedDateMidnight && wd.endTime < nextDateMidnight
    );

    return completedLogs;
  };

  const generateTemplate = (tone: string, dateStr: string): JournalSection[] => {
    const sessions = getSessionsForDate(dateStr);
    const sidetracks = getSidetracksForDate(dateStr);

    const totalSeconds = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const blocksCount = sessions.length;
    const sidetracksCount = (sessions.reduce((acc, s) => acc + (s.sidetracks?.length || 0), 0) || 0) + (sidetracks?.length || 0);

    const idGen = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    switch (tone) {
      case "stoic":
        return [
          { id: idGen("h"), type: "heading", value: "Stoic Reflection & Journal" },
          { id: idGen("q"), type: "quote", value: "First say to yourself what you would be; and then do what you have to do. — Epictetus" },
          { id: idGen("d"), type: "divider", value: "" },
          { id: idGen("h"), type: "heading", value: "What was within my control today?" },
          { id: idGen("c"), type: "callout", value: `Conducted ${blocksCount} focus sessions, totaling ${timeStr} of deliberate effort. The rest is external noise.` },
          { id: idGen("t"), type: "text", value: `We registered ${sidetracksCount} distraction(s) today. Rather than being frustrated, we accept them as opportunities to practice returning attention.` },
          { id: idGen("h"), type: "heading", value: "Mindfulness & self-correction checklist:" },
          { id: idGen("todo"), type: "todo", value: "I acted in accordance with reason and virtue today", completed: false },
          { id: idGen("todo"), type: "todo", value: "I did not let external distractions dictate my emotional state", completed: false }
        ];
      case "optimist":
      default:
        return [
          { id: idGen("h"), type: "heading", value: "🌟 Today was an Incredible Day!" },
          { id: idGen("q"), type: "quote", value: "Write it on your heart that every day is the best day in the year. — Ralph Waldo Emerson" },
          { id: idGen("d"), type: "divider", value: "" },
          { id: idGen("c"), type: "callout", value: `We registered ${blocksCount} deep focus sessions, logging ${timeStr} of growth and progress! How amazing is that?` },
          { id: idGen("h"), type: "heading", value: "Big Wins of the Day" },
          ...(sessions.flatMap(s => s.todos?.filter(t => t.completed).map(t => ({ id: idGen("todo"), type: "todo" as const, value: `Celebrated completion: ${t.text}! 🥳`, completed: true })) || [])),
          { id: idGen("t"), type: "text", value: `Even with ${sidetracksCount} minor distractions, we kept moving forward and smiled through it! Tomorrow will be even brighter.` }
        ];
    }
  };

  const applyTemplate = (tone: string) => {
    if (!activeEntry) return;

    const isEmpty = sections.length === 0 || (sections.length === 1 && sections[0].value === "");
    if (!isEmpty) {
      if (!confirm("Are you sure you want to overwrite your current journal content with this template? Any changes you made will be lost.")) {
        return;
      }
    }

    const newSections = generateTemplate(tone, activeEntry.date);
    setActiveTone(tone);
    handleUpdateSections(newSections);
    setToastMsg(`Applied ${tone.replace("_", " ")} template!`);
  };

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
      const randomTone = Math.random() < 0.5 ? "stoic" : "optimist";
      setActiveTone(randomTone);
      const defaultSections = generateTemplate(randomTone, todayStr);
      const newEntry: JournalEntry = {
        id: "journal_" + Date.now(),
        createdAt: Date.now(),
        date: todayStr,
        title: `Reflections for ${new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`,
        content: JSON.stringify(defaultSections),
        sessionsSnapshot: getSessionsForDate(todayStr),
        idleSidetracksSnapshot: getSidetracksForDate(todayStr),
        windDownSnapshot: getWindDownForDate(todayStr),
        photos: [],
        voiceMemos: [],
      };

      // Save instantly to store
      saveJournalEntry(newEntry);
      setActiveEntry(newEntry);
      setToastMsg("Journal automatically created for today!");
    }
  }, [journalsLoading, journals, activeEntry]);

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
      windDownSnapshot: getWindDownForDate(activeEntry.date),
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

  const slashCommands = [
    { id: "text", label: "Text", desc: "Plain writing block", icon: "📝", command: "/text" },
    { id: "heading", label: "Heading", desc: "Big section title", icon: "🇭", command: "/heading" },
    { id: "todo", label: "Todo List", desc: "Task with checkbox", icon: "☑", command: "/todo" },
    { id: "bullet", label: "Bullet List", desc: "Simple bulleted list", icon: "•", command: "/bullet" },
    { id: "numbered", label: "Numbered List", desc: "Sequential items list", icon: "1️⃣", command: "/numbered" },
    { id: "quote", label: "Quote Block", desc: "Styled quote section", icon: "💬", command: "/quote" },
    { id: "code", label: "Code Snippet", desc: "Monospace code editor", icon: "💻", command: "/code" },
    { id: "divider", label: "Divider Line", desc: "Horizontal rule separator", icon: "➖", command: "/divider" },
    { id: "callout", label: "Callout Box", desc: "Highlight information", icon: "💡", command: "/callout" },
  ];

  const getFilteredCommands = (query: string) => {
    return slashCommands.filter(cmd =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.command.toLowerCase().includes(query.toLowerCase())
    );
  };

  const executeSlashCommand = (sectionId: string, type: JournalSection["type"]) => {
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        type,
        value: "", // clear command prefix
        completed: type === "todo" ? false : undefined
      };
    });
    handleUpdateSections(updated);
    setNewlyCreatedSectionId(sectionId); // refocus
    setSlashMenu(null);
  };

  const updateSectionValue = (id: string, value: string) => {
    // Check if user is typing a slash command
    if (value.startsWith("/")) {
      // Check for space after slash commands to auto-execute
      if (value === "/todo ") {
        executeSlashCommand(id, "todo");
        return;
      }
      if (value === "/heading " || value === "/h ") {
        executeSlashCommand(id, "heading");
        return;
      }
      if (value === "/bullet ") {
        executeSlashCommand(id, "bullet");
        return;
      }
      if (value === "/callout ") {
        executeSlashCommand(id, "callout");
        return;
      }
      if (value === "/text ") {
        executeSlashCommand(id, "text");
        return;
      }
      if (value === "/quote " || value === "/q ") {
        executeSlashCommand(id, "quote");
        return;
      }
      if (value === "/code " || value === "/c ") {
        executeSlashCommand(id, "code");
        return;
      }
      if (value === "/divider " || value === "/div " || value === "--- ") {
        executeSlashCommand(id, "divider");
        return;
      }
      if (value === "/numbered " || value === "/n ") {
        executeSlashCommand(id, "numbered");
        return;
      }

      setSlashMenu({
        sectionId: id,
        query: value.slice(1),
        index: sections.findIndex(s => s.id === id)
      });
      setSlashMenuIndex(0);
    } else {
      setSlashMenu(null);
    }

    // Check for inline markdown shortcuts (auto-transforms on space)
    let newType: JournalSection["type"] | null = null;
    let newValue = value;
    let completed: boolean | undefined = undefined;

    if (value === "- " || value === "* ") {
      newType = "bullet";
      newValue = "";
    } else if (value === "[] " || value === "[ ] ") {
      newType = "todo";
      newValue = "";
      completed = false;
    } else if (value === "# ") {
      newType = "heading";
      newValue = "";
    } else if (value === "1. ") {
      newType = "numbered";
      newValue = "";
    } else if (value === "> ") {
      newType = "quote";
      newValue = "";
    } else if (value === "``` ") {
      newType = "code";
      newValue = "";
    } else if (value === "--- ") {
      newType = "divider";
      newValue = "";
    }

    const updatedSections = sections.map(s => {
      if (s.id !== id) return s;
      
      return {
        ...s,
        type: newType || s.type,
        value: newType ? newValue : value,
        completed: newType === "todo" ? (completed ?? false) : (newType ? undefined : s.completed)
      };
    });

    handleUpdateSections(updatedSections);
  };

  const insertSection = (type: JournalSection["type"], index: number) => {
    const newId = "sec_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const newSection: JournalSection = {
      id: newId,
      type,
      value: "",
      completed: type === "todo" ? false : undefined
    };
    const newSections = [...sections];
    newSections.splice(index + 1, 0, newSection);
    setNewlyCreatedSectionId(newId);
    handleUpdateSections(newSections);
  };

  const handleBlockKeyDown = (e: React.KeyboardEvent, index: number) => {
    const section = sections[index];
    if (!section) return;

    // Intercept keyboard controls if Slash Autocomplete Popover is open
    if (slashMenu && slashMenu.sectionId === section.id) {
      const filtered = getFilteredCommands(slashMenu.query);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev + 1) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selectedCmd = filtered[slashMenuIndex];
        if (selectedCmd) {
          executeSlashCommand(section.id, selectedCmd.id as JournalSection["type"]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenu(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Insert a new text block below
      insertSection("text", index);
    } else if (e.key === "Backspace") {
      const target = e.target as HTMLElement;
      const isStart = (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
        ? (target.selectionStart === 0 && target.selectionEnd === 0)
        : true;

      if (isStart || section.value === "") {
        e.preventDefault();
        if (section.type !== "text") {
          // Convert special block to text block
          const updated = sections.map(s => s.id === section.id ? { ...s, type: "text" as const, completed: undefined } : s);
          handleUpdateSections(updated);
          setNewlyCreatedSectionId(section.id); // refocus
        } else {
          // Delete standard text block
          if (sections.length > 1) {
            const prevSection = sections[index - 1];
            const newSections = sections.filter(s => s.id !== section.id);
            handleUpdateSections(newSections);
            if (prevSection) {
              setNewlyCreatedSectionId(prevSection.id);
            }
          }
        }
      }
    } else if (e.key === "ArrowUp") {
      const target = e.target as HTMLElement;
      const isStart = (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
        ? (target.selectionStart === 0 && target.selectionEnd === 0)
        : true;
      if (isStart) {
        const prevSection = sections[index - 1];
        if (prevSection) {
          e.preventDefault();
          setNewlyCreatedSectionId(prevSection.id);
        }
      }
    } else if (e.key === "ArrowDown") {
      const target = e.target as HTMLElement;
      const isEnd = (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
        ? (target.selectionStart === target.value.length && target.selectionEnd === target.value.length)
        : true;
      if (isEnd) {
        const nextSection = sections[index + 1];
        if (nextSection) {
          e.preventDefault();
          setNewlyCreatedSectionId(nextSection.id);
        }
      }
    }
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

        .journal-sidebar-container {
          width: 280px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          border-right: var(--theme-border-width, 0.5px) solid var(--color-border);
        }

        .journal-sidebar-container.collapsed {
          width: 0;
          opacity: 0;
          border-right: none;
          pointer-events: none;
        }

        .journal-attachments-container {
          width: 320px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          border-left: var(--theme-border-width, 0.5px) solid var(--color-border);
        }

        .journal-attachments-container.collapsed {
          width: 0;
          opacity: 0;
          border-left: none;
          pointer-events: none;
        }

        .journal-sidebar {
          width: 280px;
          height: 100%;
          background-color: var(--color-bg);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .journal-icon-btn {
          background: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          color: var(--color-muted);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 14px;
        }

        .journal-icon-btn:hover {
          background: var(--color-accent-bg);
          border-color: var(--color-accent-border);
          color: var(--color-accent);
          transform: scale(1.05);
        }

        .journal-icon-btn.active {
          color: var(--color-accent);
          background: var(--color-accent-bg);
          border-color: var(--color-accent-border);
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
          background: linear-gradient(135deg, var(--color-accent-bg), rgba(var(--accent-hue, 38), 92%, 50%, 0.12));
          border-color: var(--color-accent-border);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .journal-list-item.active .journal-item-title {
          color: var(--color-accent);
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
          padding: 24px 30px;
          border-bottom: var(--theme-border-width, 0.5px) solid var(--color-border);
        }

        .journal-editor-header-inner {
          max-width: 720px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .journal-editor-body {
          padding: 24px 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-grow: 1;
          max-width: 780px; /* 720px + padding */
          width: 100%;
          margin: 0 auto;
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

        /* Tone templates selector bar */
        .tone-template-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 8px;
          width: 100%;
          margin-bottom: 16px;
        }
        .tone-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          user-select: none;
        }
        .tone-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tone-btn {
          padding: 4px 10px;
          border-radius: 4px;
          border: 0.5px solid var(--color-border);
          background-color: var(--color-card-bg);
          color: var(--color-text);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tone-btn:hover {
          background-color: var(--color-accent-bg);
          color: var(--color-accent);
          border-color: var(--color-accent-border);
        }
        .tone-btn.active {
          background-color: var(--color-accent);
          color: var(--color-bg);
          border-color: var(--color-accent);
        }

        /* Block inputs for Quote, Code, Numbered, Divider */
        .section-input-quote {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: 15px;
          font-style: italic;
          line-height: 1.6;
          resize: none;
          padding: 4px 0;
          border-left: 3px solid var(--color-muted);
          padding-left: 12px;
        }
        .section-input-quote:focus {
          border-left-color: var(--color-accent-border);
        }
        .section-input-quote::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        .section-input-code {
          width: 100%;
          background-color: var(--color-surface);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 6px;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.5;
          resize: none;
          padding: 10px;
          margin: 4px 0;
        }
        .section-input-code:focus {
          border-color: var(--color-accent-border);
          box-shadow: 0 0 0 2px var(--color-accent-bg);
        }
        .section-input-code::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        .section-divider-wrapper {
          width: 100%;
          padding: 12px 0;
          display: flex;
          align-items: center;
          cursor: pointer;
          outline: none;
        }
        .section-divider-line {
          width: 100%;
          height: 1px;
          background-color: var(--color-border);
          transition: all 0.2s ease;
        }
        .section-divider-wrapper:focus .section-divider-line {
          background-color: var(--color-accent);
          box-shadow: 0 0 4px var(--color-accent-bg);
        }

        .section-numbered-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          padding-left: 6px;
        }
        .section-numbered-index {
          color: var(--color-accent);
          font-family: var(--font-mono);
          font-size: 14.5px;
          font-weight: 600;
          min-width: 18px;
          text-align: right;
          user-select: none;
          margin-top: 3px;
        }
        .section-numbered-text {
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
        .section-numbered-text:focus {
          border-left-color: var(--color-accent-border);
        }
        .section-numbered-text::placeholder {
          color: var(--color-muted);
          opacity: 0.4;
        }

        /* Block Toolbar */
        .block-toolbar {
          position: sticky;
          bottom: 24px;
          z-index: 100;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--floating-timer-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 9999px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          margin: 24px auto 0 auto;
          width: max-content;
          transition: all 0.2s ease;
        }

        .block-toolbar:hover {
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
          border-color: var(--color-accent-border);
        }

        .toolbar-block-btn {
          padding: 6px 12px;
          background-color: transparent;
          border: none;
          border-radius: 9999px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-muted);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
          user-select: none;
        }

        .toolbar-block-btn:hover {
          background-color: var(--color-accent-bg);
          color: var(--color-accent);
          transform: translateY(-1px);
        }

        /* Custom Todo Checkbox */
        .custom-todo-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid var(--color-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-top: 4px;
          flex-shrink: 0;
          font-size: 10px;
          font-weight: bold;
          color: transparent;
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          user-select: none;
        }
        
        .custom-todo-checkbox:hover {
          border-color: var(--color-accent);
          background-color: var(--color-accent-bg);
          color: var(--color-accent);
        }
        
        .custom-todo-checkbox.completed {
          background-color: var(--color-success);
          border-color: var(--color-success);
          color: #fff;
        }

        /* Recording Wave Animation */
        .recording-wave {
          display: inline-flex;
          align-items: center;
          gap: 2.5px;
          height: 12px;
          margin-left: 2px;
        }
        .recording-wave span {
          width: 2px;
          height: 6px;
          background-color: var(--color-panic);
          border-radius: 1px;
          animation: wavePulse 0.8s ease-in-out infinite alternate;
        }
        .recording-wave span:nth-child(2) {
          animation-delay: 0.15s;
          height: 10px;
        }
        .recording-wave span:nth-child(3) {
          animation-delay: 0.3s;
          height: 4px;
        }
        @keyframes wavePulse {
          from { transform: scaleY(1); }
          to { transform: scaleY(1.8); }
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

        .slash-menu-popover {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 4px;
          z-index: 1000;
          background: var(--floating-timer-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
          width: 240px;
          max-height: 280px;
          overflow-y: auto;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: slideUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .slash-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }

        .slash-menu-item:hover, .slash-menu-item.active {
          background-color: var(--color-accent-bg);
          color: var(--color-accent);
        }

        .slash-menu-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--color-surface);
          border-radius: 4px;
          flex-shrink: 0;
        }
        
        .slash-menu-item.active .slash-menu-icon {
          background: var(--color-accent-bg);
        }

        .slash-menu-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
        }

        .slash-menu-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .slash-menu-item.active .slash-menu-label {
          color: var(--color-accent);
        }

        .slash-menu-desc {
          font-size: 10px;
          color: var(--color-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .analytics-container {
          width: 100%;
          max-width: 1400px;
          height: calc(100vh - 120px);
          min-height: 600px;
          background-color: var(--color-card-bg);
          border: var(--theme-border-width, 0.5px) solid var(--color-border);
          border-radius: var(--theme-border-radius, 12px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          overflow-y: auto;
          padding: 24px;
          animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
      <header 
        className="app-header" 
        style={{ 
          width: "100%", 
          maxWidth: "1400px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {activeTab === "editor" && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`journal-icon-btn ${showHistory ? "active" : ""}`}
              title="Toggle Past Reflections"
            >
              📂
            </button>
          )}
          <div className="app-title">DAILY FOCUS JOURNAL</div>
        </div>

        {/* Top-Level Tabs Switcher */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <button
            onClick={() => setActiveTab("editor")}
            style={{
              background: "none",
              border: "none",
              color: activeTab === "editor" ? "var(--color-accent)" : "var(--color-muted)",
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer",
              paddingBottom: "4px",
              borderBottom: activeTab === "editor" ? "2px solid var(--color-accent)" : "2px solid transparent",
              fontFamily: "var(--font-sans)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "all 0.2s ease"
            }}
          >
            📝 Reflections
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            style={{
              background: "none",
              border: "none",
              color: activeTab === "analytics" ? "var(--color-accent)" : "var(--color-muted)",
              fontWeight: 700,
              fontSize: "11px",
              cursor: "pointer",
              paddingBottom: "4px",
              borderBottom: activeTab === "analytics" ? "2px solid var(--color-accent)" : "2px solid transparent",
              fontFamily: "var(--font-sans)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "all 0.2s ease"
            }}
          >
            📊 Analytics
          </button>

          {activeTab === "editor" && activeEntry && (
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className={`journal-icon-btn ${showAttachments ? "active" : ""}`}
              title="Toggle Media & Attachments"
              style={{ marginLeft: "10px" }}
            >
              📎
            </button>
          )}
        </div>

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
      {activeTab === "editor" ? (
        <div className="journal-container">
          {/* Sidebar (Subcomponent) */}
          <div className={`journal-sidebar-container ${showHistory ? "" : "collapsed"}`}>
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
                  <div className="journal-editor-header-inner">
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
                </div>

                {/* Editor Workspace */}
                <div className="journal-editor-body">
                  {/* Tone Template Selector */}
                  <div className="tone-template-selector">
                    <span className="tone-label">Daily Tone:</span>
                    <div className="tone-buttons">
                      <button onClick={() => applyTemplate("stoic")} className={`tone-btn ${activeTone === "stoic" ? "active" : ""}`}>Stoic</button>
                      <button onClick={() => applyTemplate("optimist")} className={`tone-btn ${activeTone === "optimist" ? "active" : ""}`}>Optimist</button>
                    </div>
                  </div>

                  {/* Notion-style sections list */}
                  <div className="journal-sections-container">
                    {sections.length === 0 ? (
                      <div 
                        className="hint-text" 
                        style={{ padding: "20px 0", textAlign: "center", cursor: "pointer" }}
                        onClick={() => addSection("text")}
                      >
                        No sections available. Click here to add a text block.
                      </div>
                    ) : (() => {
                      let currentNumberedIndex = 0;
                      return sections.map((section, idx) => {
                        let numberedIndex: number | undefined = undefined;
                        if (section.type === "numbered") {
                          const isPrevNumbered = idx > 0 && sections[idx - 1].type === "numbered";
                          if (isPrevNumbered) {
                            currentNumberedIndex++;
                          } else {
                            currentNumberedIndex = 1;
                          }
                          numberedIndex = currentNumberedIndex;
                        }
                        return (
                          <JournalSectionItem
                            key={section.id}
                            section={section}
                            idx={idx}
                            totalSections={sections.length}
                            numberedIndex={numberedIndex}
                            newlyCreatedSectionId={newlyCreatedSectionId}
                            updateSectionValue={updateSectionValue}
                            toggleTodoSection={toggleTodoSection}
                            deleteSection={deleteSection}
                            moveSection={moveSection}
                            onKeyDown={handleBlockKeyDown}
                            showSlashMenu={slashMenu?.sectionId === section.id}
                            slashMenuIndex={slashMenuIndex}
                            slashMenuQuery={slashMenu ? slashMenu.query : ""}
                            onSelectCommand={(type) => executeSlashCommand(section.id, type)}
                          />
                        );
                      });
                    })()}
                    
                    {/* Block Actions Toolbar removed by request */}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Attachments Sidebar (Right Sidebar) (Subcomponent) */}
          {activeEntry && (
            <div className={`journal-attachments-container ${showAttachments ? "" : "collapsed"}`}>
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
            </div>
          )}
        </div>
      ) : (
        <div className="analytics-container">
          <FocusAnalytics 
            selectedDate={activeEntry?.date || new Date().toISOString().split("T")[0]} 
          />
        </div>
      )}

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

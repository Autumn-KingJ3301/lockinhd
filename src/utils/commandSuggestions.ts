import type { AppMode, Session, QueueItem } from "../types";

export type CommandSuggestion = {
  command: string;
  description: string;
};

export const globalSuggestions: CommandSuggestion[] = [
  { command: "/history", description: "Toggle History panel" },
  { command: "/h", description: "Toggle History panel (shortcut)" },
  { command: "/inbox", description: "Toggle Inbox panel" },
  { command: "/i", description: "Toggle Inbox (shortcut)" },
  { command: "/theme ", description: "Set theme (light/dark/system)" },
  { command: "/export", description: "Export sessions as Markdown" },
  { command: "/e", description: "Export sessions (shortcut)" },
  { command: "/zen", description: "Toggle Zen focus mode" },
  { command: "/z", description: "Toggle Zen mode (shortcut)" },
  { command: "/sound", description: "Toggle sound feedback" },
  { command: "/so", description: "Toggle sound feedback (shortcut)" },
  { command: "/profile", description: "View your profile" },
  { command: "/p", description: "View your profile (shortcut)" },
  { command: "/revision", description: "View session revision history" },
  { command: "/rev", description: "View revision history (shortcut)" },
  { command: "/help", description: "Show all commands" },
  { command: "/?", description: "Show help (shortcut)" },
];

const idleOnlySuggestions: CommandSuggestion[] = [
  { command: "/sidetrack ", description: "Capture jumping idea" },
  { command: "/s ", description: "Capture jumping idea (shortcut)" },
  { command: "/add ", description: "Add task to queue" },
];

const activeOnlySuggestions: CommandSuggestion[] = [
  { command: "/todo ", description: "Add subtask todo" },
  { command: "/t ", description: "Add subtask todo (shortcut)" },
  { command: "/done", description: "End session" },
  { command: "/d", description: "End session (shortcut)" },
];

export function getCommandSuggestions(
  mode: AppMode,
  sessions: Session[],
  queue: QueueItem[],
  idleSidetracks: string[],
  currentSession: Session | null,
  selectedHistorySession: Session | null,
  input: string
): CommandSuggestion[] {
  const dynamicSuggestions: CommandSuggestion[] = [];

  // Extract unique past task names for autocompleting task arguments
  const pastTasks = Array.from(new Set(sessions.map((s) => s.task)));

  // 1. Task suggestions for /add [task]
  if (input.toLowerCase().startsWith("/add ")) {
    const typedTaskPart = input.substring(5);
    const matches = pastTasks.filter(t => t.toLowerCase().includes(typedTaskPart.toLowerCase()));
    
    // Suggest matching past tasks, or default templates if no matches
    const tasksToSuggest = matches.length > 0 ? matches : pastTasks;
    tasksToSuggest.slice(0, 5).forEach((task) => {
      dynamicSuggestions.push({
        command: `/add ${task}`,
        description: `Queue past task: ${task}`,
      });
    });
  }

  // 2. Suggestions for /panic command arguments
  if (input.toLowerCase().startsWith("/panic") || input.toLowerCase().startsWith("/pan")) {
    const spaceIdx = input.indexOf(" ");
    const baseCmd = spaceIdx === -1 ? input : input.substring(0, spaceIdx);

    // Context options: extensions, resetting, or turning off
    const options = [
      { arg: "+2m", desc: "Extend panic countdown by 2 minutes" },
      { arg: "+5m", desc: "Extend panic countdown by 5 minutes" },
      { arg: "+10m", desc: "Extend panic countdown by 10 minutes" },
      { arg: "off", desc: "Turn off panic mode and use normal timer" },
    ];

    options.forEach(opt => {
      const fullCmd = `${baseCmd} ${opt.arg}`;
      if (fullCmd.toLowerCase().startsWith(input.toLowerCase()) || input.endsWith(" ")) {
        dynamicSuggestions.push({
          command: fullCmd,
          description: opt.desc
        });
      }
    });

    // Suggest starting past tasks with panic in idle mode: e.g. "/panic 5m Read docs"
    if (mode === "idle") {
      const match = input.match(/^\/(panic|pan)\s+(\+|-)?(\d+)([ms]?)\s+(.*)$/i);
      const partialMatch = input.match(/^\/(panic|pan)\s+(\+|-)?(\d+)([ms]?)\s*$/i);
      
      if (match) {
        // User is typing the task name, e.g. "/panic 5m Wr"
        const base = input.substring(0, input.length - match[5].length);
        const typedTask = match[5];
        const matchesTasks = pastTasks.filter(t => t.toLowerCase().includes(typedTask.toLowerCase()));
        
        (matchesTasks.length > 0 ? matchesTasks : pastTasks).slice(0, 5).forEach((task) => {
          dynamicSuggestions.push({
            command: `${base}${task}`,
            description: `Start past task under panic: ${task}`,
          });
        });
      } else if (partialMatch) {
        // User finished typing the duration, e.g. "/panic 5m" -> suggest past tasks
        const base = input.trim() + " ";
        pastTasks.slice(0, 5).forEach((task) => {
          dynamicSuggestions.push({
            command: `${base}${task}`,
            description: `Start past task under panic: ${task}`,
          });
        });
      }
    }
  }

  // 3. /revision suggestions when reviewing history
  if (selectedHistorySession?.revisionHistory) {
    dynamicSuggestions.push({
      command: "/revision",
      description: "Show all revisions (aggregated)",
    });
    dynamicSuggestions.push({
      command: "/rev",
      description: "Show all revisions (aggregated)",
    });
    selectedHistorySession.revisionHistory.forEach((rev) => {
      dynamicSuggestions.push({
        command: `/revision ${rev.revisionNumber}`,
        description: `View Revision ${rev.revisionNumber}`,
      });
      dynamicSuggestions.push({
        command: `/rev ${rev.revisionNumber}`,
        description: `View Revision ${rev.revisionNumber}`,
      });
    });
  }

  // 4. /continue suggestions (last 5 sessions)
  if (sessions.length > 0) {
    sessions.slice(-5).reverse().forEach((s, idx) => {
      dynamicSuggestions.push({
        command: `/continue ${idx + 1}`,
        description: `Resume: ${s.task}`,
      });
    });
  }

  // 5. /rq suggestions
  if (queue.length > 0) {
    queue.slice(0, 5).forEach((q, idx) => {
      dynamicSuggestions.push({
        command: `/rq ${idx + 1}`,
        description: `Remove: ${q.text}`,
      });
    });
  }

  // 6. /di suggestions
  if (idleSidetracks.length > 0) {
    idleSidetracks.slice(-5).reverse().forEach((idea, idx) => {
      dynamicSuggestions.push({
        command: `/di ${idx + 1}`,
        description: `Delete: ${idea}`,
      });
    });
  }

  // 7. Active mode check/remove todo suggestions
  if (mode === "active" && currentSession?.todos) {
    currentSession.todos.slice(0, 5).forEach((todo, idx) => {
      dynamicSuggestions.push({
        command: `/check ${idx + 1}`,
        description: `${todo.completed ? "Uncheck" : "Check"}: ${todo.text}`,
      });
      dynamicSuggestions.push({
        command: `/remove ${idx + 1}`,
        description: `Remove todo: ${todo.text}`,
      });
    });
  }

  // Add general base command suggestions for panic / minimize
  const panicBaseSuggestions = [
    { command: "/panic ", description: "Set/extend panic countdown (+5m, 10m, off)" },
    { command: "/pan ", description: "Set/extend panic countdown (+5m, 10m, off)" },
    { command: "/minimize", description: "Minimize clock focus modal" },
    { command: "/min", description: "Minimize clock focus modal" },
  ];

  const combinedGlobal = [...globalSuggestions, ...panicBaseSuggestions];

  switch (mode) {
    case "idle":
      return [...dynamicSuggestions, ...combinedGlobal, ...idleOnlySuggestions];
    case "active":
      return [
        ...activeOnlySuggestions,
        ...dynamicSuggestions,
        ...combinedGlobal,
        ...idleOnlySuggestions,
      ];
    case "wrap":
      return [...dynamicSuggestions, ...combinedGlobal];
    default:
      return [];
  }
}

export function filterSuggestions(
  suggestions: CommandSuggestion[],
  input: string
): CommandSuggestion[] {
  if (!input.startsWith("/")) return [];
  
  // Custom prefix filtering that handles arguments/spaces properly
  return suggestions.filter(
    (cmd) =>
      cmd.command.toLowerCase().startsWith(input.toLowerCase()) || 
      input === "/" ||
      (input.includes(" ") && cmd.command.toLowerCase().startsWith(input.split(" ")[0].toLowerCase()))
  );
}

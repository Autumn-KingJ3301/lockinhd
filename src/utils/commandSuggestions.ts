import type { AppMode } from "../types";

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
  { command: "/continue ", description: "Continue session from history" },
  { command: "/con ", description: "Continue session (shortcut)" },
  { command: "/export", description: "Export sessions as Markdown" },
  { command: "/e", description: "Export sessions (shortcut)" },
  { command: "/zen", description: "Toggle Zen focus mode" },
  { command: "/z", description: "Toggle Zen mode (shortcut)" },
  { command: "/sound", description: "Toggle sound feedback" },
  { command: "/so", description: "Toggle sound feedback (shortcut)" },
  { command: "/help", description: "Show all commands" },
  { command: "/?", description: "Show help (shortcut)" },
];

const idleOnlySuggestions: CommandSuggestion[] = [
  { command: "/sidetrack ", description: "Capture jumping idea" },
  { command: "/s ", description: "Capture jumping idea (shortcut)" },
  { command: "/add ", description: "Add task to queue" },
  { command: "/rq ", description: "Remove queue item by index" },
  { command: "/di ", description: "Delete inbox idea by index" },
];

const activeOnlySuggestions: CommandSuggestion[] = [
  { command: "/todo ", description: "Add subtask todo" },
  { command: "/t ", description: "Add subtask todo (shortcut)" },
  { command: "/check ", description: "Toggle todo completion" },
  { command: "/c ", description: "Toggle todo (shortcut)" },
  { command: "/remove ", description: "Remove todo by index" },
  { command: "/r ", description: "Remove todo (shortcut)" },
  { command: "/done", description: "End session" },
  { command: "/d", description: "End session (shortcut)" },
];

export function getCommandSuggestions(mode: AppMode): CommandSuggestion[] {
  switch (mode) {
    case "idle":
      return [...globalSuggestions, ...idleOnlySuggestions];
    case "active":
      return [...activeOnlySuggestions, ...globalSuggestions, ...idleOnlySuggestions];
    case "wrap":
      return globalSuggestions;
    default:
      return [];
  }
}

export function filterSuggestions(
  suggestions: CommandSuggestion[],
  input: string
): CommandSuggestion[] {
  if (!input.startsWith("/")) return [];
  return suggestions.filter(
    (cmd) =>
      cmd.command.toLowerCase().startsWith(input.toLowerCase()) || input === "/"
  );
}

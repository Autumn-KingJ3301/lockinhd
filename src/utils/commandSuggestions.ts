import type { AppMode, Session, QueueItem } from "../types";
import { commandRegistry, getParsedCommand } from "./commandParser";
import { useThemeStore } from "../store/useThemeStore";

export type CommandSuggestion = {
  command: string;
  description: string;
};

export function getCommandSuggestions(
  _mode: AppMode,
  sessions: Session[],
  queue: QueueItem[],
  idleSidetracks: string[],
  currentSession: Session | null,
  selectedHistorySession: Session | null,
  input: string
): CommandSuggestion[] {
  if (!input.startsWith("/")) return [];

  const parsed = getParsedCommand(input);
  const pastTasks = Array.from(new Set(sessions.map((s) => s.task)));

  // If no command matched yet, suggest base commands
  if (!parsed) {
    const typed = input.substring(1).toLowerCase();
    return commandRegistry
      .filter(s => s.name.startsWith(typed) || s.shortcuts?.some(sc => sc.startsWith(typed)))
      .map(s => ({
        command: `/${s.name}`,
        description: s.description
      }));
  }

  const { schema, tokens, remainingInput } = parsed;
  const suggestions: CommandSuggestion[] = [];

  // Determine which argument we are currently typing
  // tokens[0] is always the command. 
  // schema.args is the list of expected args.
  // tokens.length - 1 is the number of args already chipped.
  // So the next arg to type is schema.args[tokens.length - 1].
  
  const currentArgIdx = tokens.length - 1;
  const currentArgSchema = schema.args[currentArgIdx];

  if (!currentArgSchema) return []; // All args chipped, maybe suggest nothing or /done if it's the end

  const baseInput = input.endsWith("\x1f") ? input : input.substring(0, input.lastIndexOf("\x1f") + 1);
  const typedArgPart = remainingInput.toLowerCase();

  switch (currentArgSchema.type) {
    case "duration":
      const durationOptions = ["+2m", "+5m", "+10m", "5m", "10m", "15m", "off"];
      durationOptions.forEach(opt => {
        if (opt.startsWith(typedArgPart)) {
          suggestions.push({
            command: `${baseInput}${opt}`,
            description: `Set duration to ${opt}`
          });
        }
      });
      break;

    case "task":
      const taskMatches = pastTasks.filter(t => t.toLowerCase().includes(typedArgPart));
      (taskMatches.length > 0 ? taskMatches : pastTasks).slice(0, 5).forEach(task => {
        suggestions.push({
          command: `${baseInput}${task}`,
          description: `Select task: ${task}`
        });
      });
      break;

    case "option":
      currentArgSchema.options?.forEach(opt => {
        if (opt.startsWith(typedArgPart)) {
          suggestions.push({
            command: `${baseInput}${opt}`,
            description: `Set to ${opt}`
          });
        }
      });
      break;

    case "index":
      // Context-aware index suggestions
      if (schema.name === "continue") {
        sessions.slice(-5).reverse().forEach((s, idx) => {
          suggestions.push({
            command: `${baseInput}${idx + 1}`,
            description: `Resume: ${s.task}`
          });
        });
      } else if (schema.name === "remove-queue") {
        queue.slice(0, 5).forEach((q, idx) => {
          suggestions.push({
            command: `${baseInput}${idx + 1}`,
            description: `Remove: ${q.text}`
          });
        });
      } else if (schema.name === "delete-idea") {
        idleSidetracks.slice(-5).reverse().forEach((idea, idx) => {
          suggestions.push({
            command: `${baseInput}${idx + 1}`,
            description: `Delete: ${idea}`
          });
        });
      } else if (schema.name === "check" || schema.name === "remove") {
        if (currentSession?.todos) {
          currentSession.todos.slice(0, 5).forEach((todo, idx) => {
            suggestions.push({
              command: `${baseInput}${idx + 1}`,
              description: `${schema.name === "check" ? (todo.completed ? "Uncheck" : "Check") : "Remove"}: ${todo.text}`
            });
          });
        }
      } else if (schema.name === "revision") {
        if (selectedHistorySession?.revisionHistory) {
          selectedHistorySession.revisionHistory.forEach(rev => {
            suggestions.push({
              command: `${baseInput}${rev.revisionNumber}`,
              description: `View Revision ${rev.revisionNumber}`
            });
          });
        }
      }
      break;
      
    case "string":
      if (schema.name === "theme") {
        const themeOptions = ["light", "dark", "system", "default", ...useThemeStore.getState().getAllThemes().map((t) => t.id)];
        // Filter unique options
        const uniqueOptions = Array.from(new Set(themeOptions));
        uniqueOptions.forEach((opt) => {
          if (opt.toLowerCase().startsWith(typedArgPart)) {
            suggestions.push({
              command: `${baseInput}${opt}`,
              description: ["light", "dark", "system"].includes(opt)
                ? `Set interface style to ${opt}`
                : opt === "default"
                ? "Reset to standard skin"
                : `Apply skin: ${opt}`
            });
          }
        });
      } else if (schema.name === "theme-uninstall") {
        useThemeStore.getState().customThemes.forEach((t) => {
          if (t.id.toLowerCase().startsWith(typedArgPart)) {
            suggestions.push({
              command: `${baseInput}${t.id}`,
              description: `Uninstall theme: ${t.name} v${t.version || "1.0.0"}`
            });
          }
        });
      }
      break;
  }

  return suggestions;
}

export function filterSuggestions(
  suggestions: CommandSuggestion[],
  _input: string
): CommandSuggestion[] {
  // Filtering is now largely handled inside getCommandSuggestions by checking typedArgPart
  // But we still want to return everything if it matches the current intent
  return suggestions;
}

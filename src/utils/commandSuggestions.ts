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
        const candidates = sessions.map((s, idx) => ({
          session: s,
          indexFromEnd: sessions.length - idx
        })).reverse();

        const filtered = typedArgPart
          ? candidates.filter(c => c.session.task.toLowerCase().includes(typedArgPart))
          : candidates;

        filtered.slice(0, 5).forEach((c) => {
          suggestions.push({
            command: `${baseInput}${c.indexFromEnd}`,
            description: `Resume: ${c.session.task}`
          });
        });
      } else if (schema.name === "remove-queue") {
        const candidates = queue.map((q, idx) => ({
          q,
          oneBasedIndex: idx + 1
        }));

        const filtered = typedArgPart
          ? candidates.filter(c => c.q.text.toLowerCase().includes(typedArgPart))
          : candidates;

        filtered.slice(0, 5).forEach((c) => {
          suggestions.push({
            command: `${baseInput}${c.oneBasedIndex}`,
            description: `Remove: ${c.q.text}`
          });
        });
      } else if (schema.name === "delete-idea") {
        const candidates = idleSidetracks.map((idea, idx) => ({
          idea,
          oneBasedIndex: idx + 1
        })).reverse();

        const filtered = typedArgPart
          ? candidates.filter(c => c.idea.toLowerCase().includes(typedArgPart))
          : candidates;

        filtered.slice(0, 5).forEach((c) => {
          suggestions.push({
            command: `${baseInput}${c.oneBasedIndex}`,
            description: `Delete: ${c.idea}`
          });
        });
      } else if (schema.name === "check" || schema.name === "remove") {
        if (currentSession?.todos) {
          const candidates = currentSession.todos.map((todo, idx) => ({
            todo,
            oneBasedIndex: idx + 1
          }));

          const filtered = typedArgPart
            ? candidates.filter(c => c.todo.text.toLowerCase().includes(typedArgPart))
            : candidates;

          filtered.slice(0, 5).forEach((c) => {
            suggestions.push({
              command: `${baseInput}${c.oneBasedIndex}`,
              description: `${schema.name === "check" ? (c.todo.completed ? "Uncheck" : "Check") : "Remove"}: ${c.todo.text}`
            });
          });
        }
      } else if (schema.name === "revision") {
        if (selectedHistorySession?.revisionHistory) {
          const candidates = selectedHistorySession.revisionHistory.map((rev) => ({
            rev,
            oneBasedIndex: rev.revisionNumber
          }));

          const filtered = typedArgPart
            ? candidates.filter(c => 
                c.rev.notes.some(n => n.text.toLowerCase().includes(typedArgPart)) ||
                c.rev.todos.some(t => t.text.toLowerCase().includes(typedArgPart)) ||
                c.rev.sidetracks.some(s => s.toLowerCase().includes(typedArgPart))
              )
            : candidates;

          filtered.slice(0, 5).forEach(c => {
            suggestions.push({
              command: `${baseInput}${c.oneBasedIndex}`,
              description: `View Revision ${c.oneBasedIndex}`
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
      } else if (schema.name === "timer") {
        if (currentSession?.todos) {
          currentSession.todos.forEach((todo) => {
            if (todo.text.toLowerCase().includes(typedArgPart)) {
              suggestions.push({
                command: `${baseInput}${todo.text}`,
                description: `Start timer for subtask: ${todo.text}`
              });
            }
          });
        }
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

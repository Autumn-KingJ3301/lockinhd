export type ArgType = "duration" | "task" | "string" | "option" | "index";

export type CommandArg = {
  name: string;
  type: ArgType;
  optional?: boolean;
  options?: string[]; // for "option" type
  allowSpaces?: boolean;
};

export interface CommandSchema {
  name: string;
  category: "tasks" | "actions" | "nav" | "settings" | "default";
  args: CommandArg[];
  description: string;
  shortcuts?: string[];
}

export interface ParsedToken {
  type: "command" | "arg";
  value: string;
  schema?: CommandArg;
  category?: CommandSchema["category"];
}

export interface ParsedCommandResult {
  schema: CommandSchema;
  tokens: ParsedToken[];
  remainingInput: string;
  nextArg?: CommandArg;
}

export const commandRegistry: CommandSchema[] = [
  {
    name: "panic",
    category: "tasks",
    description: "Start or extend panic mode",
    shortcuts: ["pan", "p"],
    args: [
      { name: "time", type: "duration", optional: true },
      { name: "task", type: "task", optional: true, allowSpaces: true }
    ]
  },
  {
    name: "callback",
    category: "tasks",
    description: "Queue a chore after current session",
    shortcuts: ["cb"],
    args: [
      { name: "time", type: "duration", optional: true },
      { name: "task", type: "task", allowSpaces: true }
    ]
  },
  {
    name: "callbacks",
    category: "nav",
    description: "Toggle callbacks list",
    args: []
  },
  {
    name: "delete-callback",
    category: "actions",
    description: "Delete callback by index",
    shortcuts: ["dc"],
    args: [
      { name: "index", type: "index" }
    ]
  },
  {
    name: "schedule",
    category: "tasks",
    description: "Schedule chore (e.g., 5pm water plants --recur)",
    shortcuts: ["sched"],
    args: [
      { name: "at", type: "string" },
      { name: "task", type: "task", allowSpaces: true }
    ]
  },
  {
    name: "schedules",
    category: "nav",
    description: "Toggle schedules list",
    args: []
  },
  {
    name: "delete-schedule",
    category: "actions",
    description: "Delete schedule by index",
    shortcuts: ["ds"],
    args: [
      { name: "index", type: "index" }
    ]
  },
  {
    name: "timer",
    category: "tasks",
    description: "Set an inline countdown timer",
    args: [
      { name: "time", type: "duration" }
    ]
  },
  {
    name: "add",
    category: "tasks",
    description: "Add task to queue",
    args: [
      { name: "task", type: "task", allowSpaces: true }
    ]
  },
  {
    name: "todo",
    category: "tasks",
    description: "Add subtask todo",
    shortcuts: ["t"],
    args: [
      { name: "text", type: "string", allowSpaces: true }
    ]
  },
  {
    name: "sidetrack",
    category: "tasks",
    description: "Capture jumping idea",
    shortcuts: ["s"],
    args: [
      { name: "text", type: "string", allowSpaces: true }
    ]
  },
  {
    name: "continue",
    category: "tasks",
    description: "Resume a past session",
    shortcuts: ["con"],
    args: [
      { name: "index", type: "index", optional: true }
    ]
  },
  {
    name: "done",
    category: "actions",
    description: "End session",
    shortcuts: ["d"],
    args: []
  },
  {
    name: "check",
    category: "actions",
    description: "Toggle todo",
    shortcuts: ["c"],
    args: [
      { name: "index", type: "index", optional: true }
    ]
  },
  {
    name: "remove",
    category: "actions",
    description: "Remove todo",
    shortcuts: ["r"],
    args: [
      { name: "index", type: "index" }
    ]
  },
  {
    name: "remove-queue",
    category: "actions",
    description: "Remove queue item",
    shortcuts: ["rq"],
    args: [
      { name: "index", type: "index" }
    ]
  },
  {
    name: "delete-idea",
    category: "actions",
    description: "Delete inbox idea",
    shortcuts: ["di"],
    args: [
      { name: "index", type: "index" }
    ]
  },
  {
    name: "export",
    category: "actions",
    description: "Export sessions",
    shortcuts: ["e"],
    args: []
  },
  {
    name: "minimize",
    category: "actions",
    description: "Minimize clock modal",
    shortcuts: ["min"],
    args: []
  },
  {
    name: "history",
    category: "nav",
    description: "Toggle history panel",
    shortcuts: ["h"],
    args: []
  },
  {
    name: "inbox",
    category: "nav",
    description: "Toggle inbox panel",
    shortcuts: ["i"],
    args: []
  },
  {
    name: "tasks",
    category: "nav",
    description: "Toggle tasks panel",
    args: []
  },
  {
    name: "profile",
    category: "nav",
    description: "View profile",
    args: []
  },
  {
    name: "help",
    category: "nav",
    description: "Show help",
    shortcuts: ["?"],
    args: []
  },
  {
    name: "theme",
    category: "settings",
    description: "Set theme",
    args: [
      { name: "mode", type: "option", options: ["light", "dark", "system"], optional: true }
    ]
  },
  {
    name: "zen",
    category: "settings",
    description: "Toggle zen mode",
    shortcuts: ["z"],
    args: []
  },
  {
    name: "sound",
    category: "settings",
    description: "Toggle sound feedback",
    shortcuts: ["so"],
    args: []
  },
  {
    name: "revision",
    category: "nav",
    description: "View revision history",
    shortcuts: ["rev"],
    args: [
      { name: "index", type: "index", optional: true }
    ]
  },
  {
    name: "archive",
    category: "actions",
    description: "Archive workspace & clear it",
    shortcuts: ["arc"],
    args: [
      { name: "label", type: "string", optional: true, allowSpaces: true }
    ]
  },
  {
    name: "archives",
    category: "nav",
    description: "Toggle archives panel",
    shortcuts: ["arcs"],
    args: []
  },
  {
    name: "stash-pop",
    category: "actions",
    description: "Pop stash back to workspace",
    shortcuts: ["sp"],
    args: []
  },
  {
    name: "stash-discard",
    category: "actions",
    description: "Discard stash permanently",
    shortcuts: ["sd"],
    args: []
  },
  {
    name: "close-archive",
    category: "actions",
    description: "Close active archive and restore workspace",
    shortcuts: ["close", "ca"],
    args: []
  }
];

export function parseDuration(durationStr: string): number | null {
  const match = durationStr.trim().match(/^(\+|-)?(\d+)([ms]?)$/i);
  if (!match) return null;
  const val = parseInt(match[2], 10);
  const unit = match[3].toLowerCase();
  const mult = unit === "s" ? 1 : 60; // default is minutes
  const total = val * mult;
  return match[1] === "-" ? -total : total;
}

export function parseCommand(input: string): { cmdName: string; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const result = getParsedCommand(input);
  if (!result) {
    // Fallback for unrecognized commands just to keep old logic somewhat compatible
    const delimiterIdx = trimmed.indexOf("\x1f") !== -1 ? trimmed.indexOf("\x1f") : trimmed.indexOf(" ");
    const rawCmd = delimiterIdx === -1 ? trimmed : trimmed.substring(0, delimiterIdx);
    const args = delimiterIdx === -1 ? "" : trimmed.substring(delimiterIdx + 1).trim();
    return { cmdName: rawCmd.substring(1).toLowerCase(), args };
  }

  // Reconstruct args string for old-style consumers
  const args = result.tokens
    .filter(t => t.type === "arg")
    .map(t => t.value)
    .join(" ") + (result.remainingInput ? (result.tokens.some(t => t.type === "arg") ? " " : "") + result.remainingInput : "");

  return { cmdName: result.schema.name, args };
}

export function getParsedCommand(input: string): ParsedCommandResult | null {
  if (!input.startsWith("/")) return null;

  const parts = input.substring(1).split("\x1f");
  
  // Requirement: Chip only on Enter or Tab (simulated by a trailing \x1f)
  const isCommandChipped = parts.length > 1 || input.endsWith("\x1f");
  if (!isCommandChipped) return null;

  const firstPart = parts[0].toLowerCase();
  const schema = commandRegistry.find(s => s.name === firstPart || s.shortcuts?.includes(firstPart));
  if (!schema) return null;

  const tokens: ParsedToken[] = [
    { type: "command", value: schema.name, category: schema.category }
  ];

  let currentIdx = 1;

  for (let i = 0; i < schema.args.length; i++) {
    const argSchema = schema.args[i];
    
    // Check if we can chip this arg.
    if (currentIdx < parts.length - 1) {
      const part = parts[currentIdx];
      let isValid = false;
      if (argSchema.type === "duration") {
        isValid = parseDuration(part) !== null;
      } else if (argSchema.type === "index") {
        isValid = !isNaN(parseInt(part, 10));
      } else if (argSchema.type === "option") {
        isValid = argSchema.options?.includes(part.toLowerCase()) || false;
      } else {
        isValid = part.trim().length > 0;
      }

      if (isValid) {
        tokens.push({ type: "arg", value: part, schema: argSchema, category: schema.category });
        currentIdx++;
      } else {
        if (!argSchema.optional) break;
      }
    } else {
      break;
    }
  }

  const remainingInput = parts.slice(currentIdx).join("\x1f");
  const nextArg = schema.args[tokens.length - 1];

  return { schema, tokens, remainingInput, nextArg };
}

// Deprecated or refactored for the new UI
export function getCommandSplit(input: string): { commandPart: string; argsPart: string; cmdName: string } | null {
  const result = getParsedCommand(input);
  if (!result) return null;

  // This is tricky because the old UI expects ONE commandPart.
  // We'll return the first token as commandPart for compatibility if needed, 
  // but the UI should ideally use getParsedCommand directly.
  return {
    commandPart: "/" + result.tokens[0].value,
    argsPart: input.substring(result.tokens[0].value.length + 2), // +2 for / and space
    cmdName: result.schema.name
  };
}

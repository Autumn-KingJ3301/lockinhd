export type ParsedCommand = {
  cmdName: string; // Normalized name (e.g., 'export', 'sidetrack', 'add', 'todo', 'check', 'remove', 'done')
  args: string;
};

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }
  
  const spaceIdx = trimmed.indexOf(" ");
  const rawCmd = spaceIdx === -1 ? trimmed : trimmed.substring(0, spaceIdx);
  const args = spaceIdx === -1 ? "" : trimmed.substring(spaceIdx + 1).trim();
  
  const cmdLower = rawCmd.substring(1).toLowerCase();
  
  let cmdName = cmdLower;
  if (cmdLower === "e") cmdName = "export";
  else if (cmdLower === "s") cmdName = "sidetrack";
  else if (cmdLower === "t") cmdName = "todo";
  else if (cmdLower === "c") cmdName = "check";
  else if (cmdLower === "r") cmdName = "remove";
  else if (cmdLower === "d") cmdName = "done";
  else if (cmdLower === "h" || cmdLower === "history") cmdName = "history";
  else if (cmdLower === "i" || cmdLower === "inbox") cmdName = "inbox";
  else if (cmdLower === "con" || cmdLower === "continue") cmdName = "continue";
  else if (cmdLower === "rq" || cmdLower === "remove-queue") cmdName = "remove-queue";
  else if (cmdLower === "di" || cmdLower === "delete-idea") cmdName = "delete-idea";
  else if (cmdLower === "theme") cmdName = "theme";
  else if (cmdLower === "z" || cmdLower === "zen") cmdName = "zen";
  else if (cmdLower === "so" || cmdLower === "sound") cmdName = "sound";
  else if (cmdLower === "help" || cmdLower === "?") cmdName = "help";
  else if (cmdLower === "p" || cmdLower === "profile") cmdName = "profile";
  else if (cmdLower === "rev" || cmdLower === "revision") cmdName = "revision";
  else if (cmdLower === "pan" || cmdLower === "panic") cmdName = "panic";
  else if (cmdLower === "min" || cmdLower === "minimize") cmdName = "minimize";
  
  return { cmdName, args };
}

export function parseDuration(durationStr: string): number | null {
  const match = durationStr.trim().match(/^(\+|-)?(\d+)([ms]?)$/i);
  if (!match) return null;
  const val = parseInt(match[2], 10);
  const unit = match[3].toLowerCase();
  const mult = unit === "s" ? 1 : 60; // default is minutes
  const total = val * mult;
  return match[1] === "-" ? -total : total;
}

export function getCommandSplit(input: string): { commandPart: string; argsPart: string; cmdName: string } | null {
  if (!input.startsWith("/")) return null;
  
  const spaceIdx = input.indexOf(" ");
  if (spaceIdx === -1) return null;
  
  const commandPart = input.substring(0, spaceIdx);
  const argsPart = input.substring(spaceIdx + 1);
  
  // Validate if it's a known command
  const parsed = parseCommand(commandPart);
  
  const validBaseCommands = [
    "export", "sidetrack", "todo", "check", "remove", "done", 
    "history", "inbox", "continue", "remove-queue", "delete-idea", 
    "theme", "zen", "sound", "help", "profile", "add", "revision",
    "panic", "minimize"
  ];
  
  if (parsed && (validBaseCommands.includes(parsed.cmdName) || parsed.cmdName !== commandPart.substring(1).toLowerCase())) {
    return { commandPart, argsPart, cmdName: parsed.cmdName };
  }

  return null;
}

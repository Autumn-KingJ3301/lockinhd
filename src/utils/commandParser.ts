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
  
  return { cmdName, args };
}

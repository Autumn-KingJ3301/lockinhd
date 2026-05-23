import type { Session } from "../types";
import { formatSummaryDuration, formatTimestamp } from "./timeFormatters";

export const generateMarkdownExport = (sessionsList: Session[], idleSidetracks: string[]) => {
  const todayStr = new Date().toISOString().split("T")[0];
  let md = `# LOCK·IN Focus Log — ${todayStr}\n\n`;

  if (sessionsList.length === 0 && idleSidetracks.length === 0) {
    md += "_No sessions or sidetracks recorded today._\n";
    return md;
  }

  const totalFocusSeconds = sessionsList.reduce((acc, s) => acc + (s.duration || 0), 0);
  md += `## Summary\n`;
  md += `- **Total Sessions**: ${sessionsList.length}\n`;
  md += `- **Total Focus Time**: ${formatSummaryDuration(totalFocusSeconds)}\n`;
  md += `- **Total Sidetracks captured**: ${sessionsList.reduce((acc, s) => acc + (s.sidetracks?.length || 0), 0) + idleSidetracks.length}\n\n`;
  md += `---\n\n`;

  if (sessionsList.length > 0) {
    sessionsList.forEach((s, idx) => {
      md += `## ${idx + 1}. Focus Session: ${s.task}\n`;
      md += `- **Duration**: ${formatSummaryDuration(s.duration || 0)}\n`;
      if (s.endTime) {
        const completionTime = new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        md += `- **Status**: Completed at ${completionTime}\n`;
      }

      if (s.todos && s.todos.length > 0) {
        md += `- **Subtasks**:\n`;
        s.todos.forEach(todo => {
          md += `  - [${todo.completed ? "x" : " "}] ${todo.text}\n`;
        });
      }

      if (s.sidetracks && s.sidetracks.length > 0) {
        md += `- **Jumping Ideas / Sidetracks**:\n`;
        s.sidetracks.forEach(track => {
          md += `  - 💡 ${track}\n`;
        });
      }

      if (s.notes.length > 0) {
        md += `- **Notes**:\n`;
        s.notes.forEach(note => {
          const noteTime = formatTimestamp(note.ts);
          md += `  - **${noteTime}**: ${note.text}\n`;
        });
      } else {
        md += `- **Notes**: _None_\n`;
      }

      md += `\n---\n\n`;
    });
  }

  if (idleSidetracks.length > 0) {
    md += `## Inbox / Braindump (Uncategorized Ideas)\n`;
    idleSidetracks.forEach(track => {
      md += `- 💡 ${track}\n`;
    });
    md += `\n`;
  }

  return md.trim();
};

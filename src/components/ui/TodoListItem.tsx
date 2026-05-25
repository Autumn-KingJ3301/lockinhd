import React from "react";
import { TodoItem } from "../../types";
import { formatTime } from "../../utils/timeFormatters";

interface TodoListItemProps {
  todo: TodoItem;
  index: number;
  elapsed?: number;
  onClick?: () => void;
  showTimer?: boolean;
}

export const TodoListItem: React.FC<TodoListItemProps> = ({ 
  todo, 
  index, 
  elapsed = 0, 
  onClick,
  showTimer = true
}) => {
  let currentTodoElapsed = todo.isTimerRunning 
    ? (todo.timerDuration || 0) + (elapsed - (todo.timerStartElapsed || elapsed))
    : (todo.timerDuration || 0);

  const isCountdown = todo.timerTargetElapsed !== undefined;
  let displayTime = currentTodoElapsed;
  let isExpired = false;

  if (isCountdown) {
    const remaining = todo.timerTargetElapsed! - elapsed;
    displayTime = Math.max(0, remaining);
    isExpired = remaining <= 0;
  }

  return (
    <div
      className={`todo-item ${todo.isTimerRunning ? "timer-running" : ""} ${isExpired ? "subtimer-expired" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <span className="todo-checkbox">{todo.completed ? "[x]" : "[ ]"}</span>
      <span className={`todo-text ${todo.completed ? "completed" : ""}`} style={{ flexGrow: 1 }}>
        {index + 1}. {todo.text}
      </span>
      
      {showTimer && (currentTodoElapsed > 0 || todo.isTimerRunning || isCountdown) && (
        <span style={{ 
          fontSize: "10px", 
          color: todo.isTimerRunning ? "var(--color-accent)" : "var(--color-muted)", 
          marginRight: "4px", 
          fontFamily: "var(--font-mono)",
          fontWeight: isExpired ? "bold" : "normal"
        }}>
          {isCountdown ? (isExpired ? "00:00" : formatTime(displayTime)) : formatTime(displayTime)}
        </span>
      )}
    </div>
  );
};

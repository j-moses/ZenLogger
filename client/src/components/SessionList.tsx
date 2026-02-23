import React, { useState } from "react";
import CalendarView from "./CalendarView";

interface Session {
  _id: string;
  durationInSeconds: number;
  createdAt: string;
}

interface SessionListProps {
  sessions: Session[];
  initialView?: string;
  onDeleteSession: (id: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, initialView, onDeleteSession }) => {
  const [viewMode, setViewMode] = useState(initialView || "list");
  
  const [prevInitialView, setPrevInitialView] = useState(initialView);

  if (initialView !== prevInitialView) {
    setPrevInitialView(initialView);
    setViewMode(initialView || "list");
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="session-list">
      <h3
        className="clickable-header"
        onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
      >
        {viewMode === "list" ? "Previous Sessions" : "Calendar View"}
        <span className="toggle-hint">(click to switch)</span>
      </h3>

      {viewMode === "list" ? (
        <ul>
          {sessions.map((session) => (
            <li key={session._id}>
              <div className="session-data">
                <span className="duration">
                  {formatDuration(session.durationInSeconds)}
                </span>
                <span className="date">{formatDate(session.createdAt)}</span>
              </div>
              <button 
                className="delete-session-btn" 
                onClick={() => onDeleteSession(session._id)}
                title="Delete Session"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <CalendarView sessions={sessions} />
      )}
    </div>
  );
};

export default SessionList;

import React, { useState, useEffect, useRef } from "react";

interface TimerProps {
  onSessionCompleted: (elapsed: number) => void;
  onSaveEarly: (elapsed: number) => void;
  onGoalChanged: (newGoal: number) => void;
  initialGoal: number;
  soundPath: string;
  disabled?: boolean;
}

const Timer: React.FC<TimerProps> = ({ 
  onSessionCompleted, 
  onSaveEarly, 
  onGoalChanged, 
  initialGoal, 
  soundPath,
  disabled = false
}) => {
  const [timeLeft, setTimeLeft] = useState(initialGoal || 300);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState<string | number>(Math.floor((initialGoal || 300) / 60));
  const [currentGoal, setCurrentGoal] = useState(initialGoal || 300);
  
  const [totalElapsed, setTotalElapsed] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoggedRef = useRef(false);
  const [prevInitialGoal, setPrevInitialGoal] = useState(initialGoal);

  if (initialGoal !== prevInitialGoal) {
    setPrevInitialGoal(initialGoal);
    setTimeLeft(initialGoal);
    setCurrentGoal(initialGoal);
    setEditMinutes(Math.floor(initialGoal / 60));
    setTotalElapsed(0);
    setIsRunning(false);
    hasLoggedRef.current = false;
  }

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(soundPath || "/meditation-bell.wav");
  }, [soundPath]);

  const playSound = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setTimeout(() => {
        audio.play().catch((err) => console.log("Audio play blocked:", err));
      }, 100);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && isRunning && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      setIsRunning(false);
      playSound();
      onSessionCompleted(totalElapsed);
    }
  }, [timeLeft, isRunning, totalElapsed, onSessionCompleted]);

  useEffect(() => {
    if (isRunning && timeLeft > 0 && !disabled) {
      hasLoggedRef.current = false; 
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, disabled]);

  const toggleTimer = () => {
    if (disabled) return;
    setIsRunning(!isRunning);
    setIsEditing(false);
    if (!isRunning && audioRef.current) {
      audioRef.current.load();
    }
  };

  const handleResetGoal = () => {
    if (disabled) return;
    setIsRunning(false);
    setTimeLeft(currentGoal);
  };

  const handleResetElapsed = () => {
    if (disabled) return;
    setTotalElapsed(0);
    hasLoggedRef.current = false;
  };

  const handleTimerClick = () => {
    if (disabled || isRunning) return;
    setIsRunning(false);
    setIsEditing(true);
    setEditMinutes(Math.floor(timeLeft / 60));
  };

  const handleSaveEdit = () => {
    let minutes = parseInt(editMinutes.toString());
    if (isNaN(minutes) || minutes < 1) minutes = 1;
    
    const newGoalInSeconds = minutes * 60;
    setTimeLeft(newGoalInSeconds);
    setCurrentGoal(newGoalInSeconds);
    setEditMinutes(minutes);
    setIsEditing(false);
    onGoalChanged(newGoalInSeconds); 
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showSaveEarly = totalElapsed > 0 && timeLeft > 0;

  return (
    <div className={`timer-container ${disabled ? 'disabled' : ''}`}>
      {isEditing ? (
        <div className="edit-mode">
          <input
            disabled={disabled}
            type="number"
            value={editMinutes}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setEditMinutes(val);
            }}
            onKeyDown={(e) => {
              if (['e', 'E', '.', '+', '-'].includes(e.key)) e.preventDefault();
              if (e.key === 'Enter') handleSaveEdit();
            }}
            min="1"
            autoFocus
          />
          <span className="static-seconds">:00</span>
          <button onClick={handleSaveEdit} disabled={disabled}>Set</button>
        </div>
      ) : (
        <div className={`timer-display ${disabled ? 'disabled' : ''}`} onClick={handleTimerClick}>
          {formatTime(timeLeft)}
        </div>
      )}
      
      <div className="session-info">
        <span>Goal: {formatTime(currentGoal)}</span>
        <button 
            className="reset-btn" 
            onClick={handleResetGoal} 
            disabled={disabled}
            title="Reset Timer to Goal"
        >
          ↺
        </button>
      </div>

      <div className="timer-controls">
        <button className="start-stop-btn" onClick={toggleTimer} disabled={disabled}>
          {isRunning ? "⏸" : "▶"}
        </button>
      </div>
      
      <div className="elapsed-info">
        <span>Elapsed: {formatTime(totalElapsed)}</span>
        <div className="elapsed-actions">
          {showSaveEarly && (
            <button 
              className="save-early-btn-mini" 
              onClick={() => {
                setIsRunning(false);
                onSaveEarly(totalElapsed);
              }} 
              disabled={disabled}
              title="Save progress and finish"
            >
              ✓
            </button>
          )}
          {totalElapsed > 0 && (
            <button 
              className="reset-btn-mini" 
              onClick={handleResetElapsed} 
              disabled={disabled}
              title="Reset Elapsed Time"
            >
              ↺
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;

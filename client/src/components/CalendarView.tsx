import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';

interface Session {
    _id: string;
    durationInSeconds: number;
    createdAt: string;
}

interface CalendarViewProps {
    sessions?: Session[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions = [] }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getDayStats = (day: Date) => {
        const daySessions = sessions.filter(session => 
            isSameDay(parseISO(session.createdAt), day)
        );
        const totalSeconds = daySessions.reduce((acc, curr) => acc + curr.durationInSeconds, 0);
        return totalSeconds > 0 ? formatDuration(totalSeconds) : null;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        if (mins === 0) return `${seconds}s`;
        return `${mins}m`;
    };

    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
    const handlePrevYear = () => setViewDate(subMonths(viewDate, 12));
    const handleNextYear = () => setViewDate(addMonths(viewDate, 12));

    return (
        <div className="calendar-container">
            <div className="calendar-nav">
                <button onClick={handlePrevYear}>«</button>
                <button onClick={handlePrevMonth}>‹</button>
                <span 
                    className="current-month-label clickable" 
                    onClick={() => setViewDate(new Date())}
                    title="Go to today"
                >
                    {format(viewDate, 'MMMM yyyy')}
                </span>
                <button onClick={handleNextMonth}>›</button>
                <button onClick={handleNextYear}>»</button>
            </div>
            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}
                {calendarDays.map((day, idx) => {
                    const stats = getDayStats(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    return (
                        <div 
                            key={idx} 
                            className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
                        >
                            <span className="day-number">{format(day, 'd')}</span>
                            {stats && <span className="day-stats">{stats}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;

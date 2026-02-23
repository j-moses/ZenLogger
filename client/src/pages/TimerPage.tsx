import React, { useState, useEffect, useCallback, useRef } from 'react';
import Timer from '../components/Timer';
import SessionList from '../components/SessionList';
import ConfirmModal from '../components/ui/ConfirmModal';
import { DataService, Session } from '../services/DataService';

interface ModalConfig {
    isOpen: boolean;
    type: 'delete' | 'saveEarly' | null;
    title: string;
    message: string;
    data: any;
}

const TimerPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [savedGoal, setSavedGoal] = useState<number>(300);
    const [defaultView, setDefaultView] = useState<string>('list');
    const [selectedSound, setSelectedSound] = useState<string>('/meditation-bell.wav');
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [timerKey, setTimerKey] = useState<number>(0);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    const [newDefaultView, setNewDefaultView] = useState<string>('list');
    const [newSelectedSound, setNewSelectedSound] = useState<string>('/meditation-bell.wav');
    
    const optionsRef = useRef<HTMLDivElement>(null);

    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        isOpen: false,
        type: null, 
        title: '',
        message: '',
        data: null
    });

    const soundOptions = [
        { label: 'Original Bell', value: '/meditation-bell.wav' },
        { label: 'Rain', value: '/sounds/bell-3.mp3' },
        { label: 'Wind Chimes', value: '/sounds/alex_jauk-wind-chimes-noise-398733.mp3' },
        { label: 'Singing Bell', value: '/sounds/freesound_community-singing-bell-hit-1-105400.mp3' },
        { label: 'Meditation Bell', value: '/sounds/freesound_community-bell-meditation-75335.mp3' },
        { label: 'Root Chakra Bell', value: '/sounds/floraphonic-deep-meditation-bell-hit-root-chakra-8-186974.mp3' },
        { label: 'Sacral Chakra Bell', value: '/sounds/floraphonic-deep-meditation-bell-hit-sacral-chakra-2-186968.mp3' },
        { label: 'Copper Bell 1', value: '/sounds/floraphonic-copper-bell-ding-1-172685.mp3' },
        { label: 'Copper Bell 2', value: '/sounds/floraphonic-copper-bell-ding-23-215438.mp3' },
        { label: 'Copper Bell 3', value: '/sounds/floraphonic-copper-bell-ding-25-204990.mp3' },
        { label: 'Notification Bell 1', value: '/sounds/dragon-studio-notification-bell-sound-1-376885.mp3' },
        { label: 'Notification Bell 2', value: '/sounds/dragon-studio-notification-bell-sound-376888.mp3' },
        { label: 'Door Bell', value: '/sounds/freesound_community-old-style-door-bell-101191.mp3' },
    ];

    const fetchSessions = useCallback(async () => {
        try {
            const data = await DataService.getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    }, []);

    const fetchSettings = async () => {
        try {
            const goal = await DataService.getSetting('meditationGoal', 300);
            const view = await DataService.getSetting('defaultView', 'list');
            const sound = await DataService.getSetting('selectedSound', '/meditation-bell.wav');
            
            setSavedGoal(goal);
            setDefaultView(view);
            setNewDefaultView(view);
            setSelectedSound(sound);
            setNewSelectedSound(sound);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    useEffect(() => {
        fetchSessions();
        fetchSettings();
    }, [fetchSessions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        };

        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    const handleSessionCompleted = useCallback(async (durationInSeconds: number) => {
        if (durationInSeconds <= 0) return;
        setIsSaving(true);
        try {
            await DataService.addSession(durationInSeconds);
            await fetchSessions();
            setTimerKey(prev => prev + 1); 
        } catch (error) {
            console.error('Error saving session:', error);
        } finally {
            setIsSaving(false);
        }
    }, [fetchSessions]);

    const handleGoalChanged = async (newGoalInSeconds: number) => {
        setIsSaving(true);
        try {
            await DataService.setSetting('meditationGoal', newGoalInSeconds);
            setSavedGoal(newGoalInSeconds);
        } catch (error) {
            console.error('Error persisting goal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (id: string) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            title: 'Delete Session',
            message: 'Are you sure you want to permanently remove this session from your history?',
            data: id
        });
    };

    const openSaveEarlyModal = (elapsedSeconds: number) => {
        setModalConfig({
            isOpen: true,
            type: 'saveEarly',
            title: 'Finish Early?',
            message: `Would you like to save your progress (${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s) and end the session?`,
            data: elapsedSeconds
        });
    };

    const handleConfirm = async () => {
        if (modalConfig.type === 'delete') {
            setIsSaving(true);
            try {
                await DataService.deleteSession(modalConfig.data);
                await fetchSessions();
            } catch (error) {
                console.error('Error deleting session:', error);
            } finally {
                setIsSaving(false);
            }
        } else if (modalConfig.type === 'saveEarly') {
            await handleSessionCompleted(modalConfig.data);
        }
        closeModal();
    };

    const closeModal = () => {
        if (isSaving) return;
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await Promise.all([
                DataService.setSetting('defaultView', newDefaultView),
                DataService.setSetting('selectedSound', newSelectedSound)
            ]);
            setDefaultView(newDefaultView);
            setSelectedSound(newSelectedSound);
            setShowOptions(false);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const previewSelectedSound = (soundPath: string) => {
        const audio = new Audio(soundPath);
        audio.play().catch(e => console.error("Preview failed", e));
    };

    return (
        <div className={`timer-page ${isSaving ? 'is-loading' : ''}`}>
            {isSaving && <div className="loading-bar" />}
            
            <div ref={optionsRef}>
                <div className={`options-icon ${isSaving ? 'disabled' : ''}`} onClick={() => !isSaving && setShowOptions(!showOptions)}>
                    ⚙️
                </div>
                
                {showOptions && (
                    <div className="options-menu">
                        <h3>Settings</h3>
                        <div className="setting-item">
                            <label>Default View:</label>
                            <select 
                                disabled={isSaving}
                                value={newDefaultView} 
                                onChange={(e) => setNewDefaultView(e.target.value)}
                            >
                                <option value="list">List</option>
                                <option value="calendar">Calendar</option>
                            </select>
                        </div>
                        <div className="setting-item">
                            <label>Alert Sound:</label>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <select 
                                    disabled={isSaving}
                                    value={newSelectedSound} 
                                    onChange={(e) => setNewSelectedSound(e.target.value)}
                                    style={{ width: '100px' }}
                                >
                                    {soundOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <button 
                                    disabled={isSaving}
                                    onClick={() => previewSelectedSound(newSelectedSound)}
                                    style={{ width: '30px', padding: '0', fontSize: '10px' }}
                                    title="Preview selected"
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                        <button disabled={isSaving} onClick={saveSettings}>
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                )}
            </div>

            <h1>Zen Logger</h1>
            <Timer 
                key={timerKey}
                onSessionCompleted={handleSessionCompleted} 
                onSaveEarly={openSaveEarlyModal}
                onGoalChanged={handleGoalChanged}
                initialGoal={savedGoal} 
                soundPath={selectedSound}
                disabled={isSaving}
            />
            <SessionList 
                sessions={sessions} 
                initialView={defaultView} 
                onDeleteSession={openDeleteModal} 
            />

            <ConfirmModal 
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={isSaving ? 'Processing...' : (modalConfig.type === 'delete' ? 'Delete' : 'OK')}
                confirmClass={modalConfig.type === 'delete' ? 'delete' : 'save'}
                onConfirm={handleConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

export default TimerPage;

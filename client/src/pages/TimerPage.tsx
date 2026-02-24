import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@capacitor/navigation-bar';
import Timer from '../components/Timer';
import SessionList from '../components/SessionList';
import ConfirmModal from '../components/ui/ConfirmModal';
import { DataService, Session } from '../services/DataService';

interface ModalConfig {
    isOpen: boolean;
    type: 'delete' | 'saveEarly' | 'clearSessions' | null;
    title: string;
    message: string;
    data: any;
    requiredConfirmText?: string;
}

const TimerPage: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [savedGoal, setSavedGoal] = useState<number>(300);
    const [defaultView, setDefaultView] = useState<string>('list');
    const [selectedSound, setSelectedSound] = useState<string>('/sounds/bell-3.mp3');
    const [currentTheme, setCurrentTheme] = useState<string>('light');
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [timerKey, setTimerKey] = useState<number>(0);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    // Focus Mode states
    const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
    const [currentTimeLeft, setCurrentTimeLeft] = useState<number>(300);
    const [lineLeft, setLineLeft] = useState<number>(50); // percentage
    
    const [newDefaultView, setNewDefaultView] = useState<string>('list');
    const [newSelectedSound, setNewSelectedSound] = useState<string>('/sounds/bell-3.mp3');
    const [newTheme, setNewTheme] = useState<string>('light');
    
    const optionsRef = useRef<HTMLDivElement>(null);

    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        isOpen: false,
        type: null, 
        title: '',
        message: '',
        data: null
    });

    const themeOptions = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'OLED Black', value: 'oled' },
    ];

    const soundOptions = [
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
            const sound = await DataService.getSetting('selectedSound', '/sounds/bell-3.mp3');
            const theme = await DataService.getSetting('theme', 'light');
            
            setSavedGoal(goal);
            setDefaultView(view);
            setNewDefaultView(view);
            setSelectedSound(sound);
            setNewSelectedSound(sound);
            setCurrentTheme(theme);
            setNewTheme(theme);
            
            // Apply theme
            document.documentElement.setAttribute('data-theme', theme);
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

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        
        // Focus Mode UI control
        if (isFocusMode) {
            StatusBar.hide();
            NavigationBar.hide();
            
            if (currentTimeLeft > 0) {
                KeepAwake.keepAwake();
            } else {
                KeepAwake.allowSleep();
            }

            interval = setInterval(() => {
                const randomPos = Math.floor(Math.random() * 80) + 10;
                setLineLeft(randomPos);
            }, 60000);
        } else {
            StatusBar.show();
            NavigationBar.show();
            KeepAwake.allowSleep();
        }
        
        return () => {
            if (interval) clearInterval(interval);
            StatusBar.show();
            NavigationBar.show();
            KeepAwake.allowSleep();
        };
    }, [isFocusMode, currentTimeLeft > 0]);

    const handleSessionCompleted = useCallback(async (durationInSeconds: number) => {
        if (durationInSeconds <= 0) return;
        setIsSaving(true);
        if (isFocusMode) setIsFocusMode(false); // Exit focus mode on complete
        try {
            await DataService.addSession(durationInSeconds);
            await fetchSessions();
            setTimerKey(prev => prev + 1); 
        } catch (error) {
            console.error('Error saving session:', error);
        } finally {
            setIsSaving(false);
        }
    }, [fetchSessions, isFocusMode]);

    const handleGoalChanged = async (newGoalInSeconds: number) => {
        setIsSaving(true);
        try {
            await DataService.setSetting('meditationGoal', newGoalInSeconds);
            setSavedGoal(newGoalInSeconds);
            setCurrentTimeLeft(newGoalInSeconds);
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

    const openClearSessionsModal = () => {
        setModalConfig({
            isOpen: true,
            type: 'clearSessions',
            title: 'Clear All History',
            message: 'This will permanently delete ALL your meditation history. This action cannot be undone.',
            data: null,
            requiredConfirmText: 'delete'
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
        } else if (modalConfig.type === 'clearSessions') {
            setIsSaving(true);
            try {
                await DataService.clearAllSessions();
                await fetchSessions();
                setShowOptions(false);
            } catch (error) {
                console.error('Error clearing sessions:', error);
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
                DataService.setSetting('selectedSound', newSelectedSound),
                DataService.setSetting('theme', newTheme)
            ]);
            setDefaultView(newDefaultView);
            setSelectedSound(newSelectedSound);
            setCurrentTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
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

    const handleExport = async () => {
        try {
            setIsSaving(true);
            const jsonString = await DataService.exportData();
            const fileName = `zenlogger_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            // Save to filesystem first (Cache directory is accessible by Share plugin)
            const result = await Filesystem.writeFile({
                path: fileName,
                data: jsonString,
                directory: Directory.Cache,
                encoding: Encoding.UTF8
            });

            // Share the file
            await Share.share({
                title: 'ZenLogger Data Backup',
                url: result.uri,
                dialogTitle: 'Save ZenLogger Backup'
            });
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please ensure the app has storage permissions.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            try {
                if (window.confirm('Importing will overwrite your current settings and history. Continue?')) {
                    setIsSaving(true);
                    await DataService.importData(content);
                    window.location.reload(); // Reload to refresh all state from new data
                }
            } catch (error) {
                console.error('Import failed:', error);
                alert('Failed to import data. Please ensure the file is a valid ZenLogger backup.');
                setIsSaving(false);
            }
        };
        reader.readAsText(file);
    };

    const toggleFocusMode = () => {
        setIsFocusMode(!isFocusMode);
    };

    const lineHeightPercent = Math.min(100, Math.max(0, (currentTimeLeft / savedGoal) * 100));

    return (
        <div className={`timer-page ${isSaving ? 'is-loading' : ''}`}>
            {isSaving && <div className="loading-bar" />}
            
            {isFocusMode && (
                <div className="focus-overlay" onClick={toggleFocusMode}>
                    <div 
                        className="focus-line" 
                        style={{ 
                            height: `${lineHeightPercent}%`, 
                            left: `${lineLeft}%` 
                        }} 
                    />
                </div>
            )}

            <div className="focus-mode-toggle" onClick={toggleFocusMode} title="Toggle Focus Mode">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
            </div>
            
            <div ref={optionsRef}>
                <div className={`options-icon ${isSaving ? 'disabled' : ''}`} onClick={() => !isSaving && setShowOptions(!showOptions)}>
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                    </svg>
                </div>
                
                {showOptions && (
                    <div className="options-menu">
                        <h3>Settings</h3>
                        <div className="setting-item">
                            <label>Appearance:</label>
                            <select 
                                disabled={isSaving}
                                value={newTheme} 
                                onChange={(e) => setNewTheme(e.target.value)}
                            >
                                {themeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
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

                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem' }}>Data Management</h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    className="data-mgmt-btn"
                                    disabled={isSaving} 
                                    onClick={handleExport}
                                    style={{ background: 'var(--secondary-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                                >
                                    Export
                                </button>
                                <button 
                                    className="data-mgmt-btn"
                                    disabled={isSaving} 
                                    onClick={() => document.getElementById('import-input')?.click()}
                                    style={{ background: 'var(--secondary-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                                >
                                    Import
                                </button>
                                <button 
                                    className="data-mgmt-btn"
                                    disabled={isSaving} 
                                    onClick={openClearSessionsModal}
                                    style={{ background: 'var(--secondary-bg)', color: 'var(--danger-color)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                                >
                                    Clear
                                </button>
                                <input 
                                    type="file" 
                                    id="import-input" 
                                    accept=".json" 
                                    onChange={handleImport} 
                                    style={{ display: 'none' }} 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Timer 
                key={timerKey}
                onSessionCompleted={handleSessionCompleted} 
                onSaveEarly={openSaveEarlyModal}
                onGoalChanged={handleGoalChanged}
                onTick={setCurrentTimeLeft}
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
                confirmText={isSaving ? 'Processing...' : (modalConfig.type === 'delete' || modalConfig.type === 'clearSessions' ? 'Delete' : 'OK')}
                confirmClass={modalConfig.type === 'delete' || modalConfig.type === 'clearSessions' ? 'delete' : 'save'}
                onConfirm={handleConfirm}
                onCancel={closeModal}
                requiredConfirmText={modalConfig.requiredConfirmText}
            />
        </div>
    );
};

export default TimerPage;

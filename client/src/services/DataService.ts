import { Preferences } from '@capacitor/preferences';

export interface Session {
    _id: string;
    durationInSeconds: number;
    createdAt: string;
}

const SESSIONS_KEY = 'zen_logger_sessions';

export const DataService = {
    async getSessions(): Promise<Session[]> {
        const { value } = await Preferences.get({ key: SESSIONS_KEY });
        return value ? JSON.parse(value) : [];
    },

    async addSession(durationInSeconds: number): Promise<Session> {
        const sessions = await this.getSessions();
        const newSession: Session = {
            _id: Date.now().toString(),
            durationInSeconds,
            createdAt: new Date().toISOString()
        };
        sessions.unshift(newSession); // Newest first
        await Preferences.set({
            key: SESSIONS_KEY,
            value: JSON.stringify(sessions)
        });
        return newSession;
    },

    async deleteSession(id: string): Promise<void> {
        let sessions = await this.getSessions();
        sessions = sessions.filter(s => s._id !== id);
        await Preferences.set({
            key: SESSIONS_KEY,
            value: JSON.stringify(sessions)
        });
    },

    async clearAllSessions(): Promise<void> {
        await Preferences.set({
            key: SESSIONS_KEY,
            value: JSON.stringify([])
        });
    },

    async getSetting(key: string, defaultValue: any): Promise<any> {
        const { value } = await Preferences.get({ key: `setting_${key}` });
        return value ? JSON.parse(value) : defaultValue;
    },

    async setSetting(key: string, value: any): Promise<void> {
        await Preferences.set({
            key: `setting_${key}`,
            value: JSON.stringify(value)
        });
    },

    async exportData(): Promise<string> {
        const { keys } = await Preferences.keys();
        const allData: Record<string, string> = {};
        
        for (const key of keys) {
            const { value } = await Preferences.get({ key });
            if (value !== null) {
                // Keep it as a raw string to avoid double-serialization issues
                allData[key] = value;
            }
        }
        
        return JSON.stringify({
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            data: allData
        }, null, 2);
    },

    async importData(jsonString: string): Promise<void> {
        const parsed = JSON.parse(jsonString);
        if (!parsed.data) throw new Error("Invalid backup format");
        
        const data = parsed.data;
        for (const key in data) {
            await Preferences.set({
                key,
                value: data[key] // data[key] is already a JSON string from the export
            });
        }
    }
};

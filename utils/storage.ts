import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Exercise {
  id: string;
  name: string;
  notes?: string;
}

export interface WorkoutPreset {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: {
    reps: number;
    weight: number;
  }[];
}

export interface WorkoutSession {
  id: string;
  presetId: string;
  presetName: string;
  date: string;
  exercises: ExerciseLog[];
}

const PRESETS_KEY = '@workout_presets';
const SESSIONS_KEY = '@workout_sessions';

export const storage = {
  async getPresets(): Promise<WorkoutPreset[]> {
    try {
      const data = await AsyncStorage.getItem(PRESETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading presets:', error);
      return [];
    }
  },

  async savePresets(presets: WorkoutPreset[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving presets:', error);
    }
  },

  async addPreset(preset: WorkoutPreset): Promise<void> {
    const presets = await this.getPresets();
    await this.savePresets([...presets, preset]);
  },

  async updatePreset(preset: WorkoutPreset): Promise<void> {
    const presets = await this.getPresets();
    const updated = presets.map((p) => (p.id === preset.id ? preset : p));
    await this.savePresets(updated);
  },

  async deletePreset(id: string): Promise<void> {
    const presets = await this.getPresets();
    await this.savePresets(presets.filter((p) => p.id !== id));
  },

  async getSessions(): Promise<WorkoutSession[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  async saveSessions(sessions: WorkoutSession[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  },

  async addSession(session: WorkoutSession): Promise<void> {
    const sessions = await this.getSessions();
    await this.saveSessions([session, ...sessions]);
  },

  async getLastPerformance(
    exerciseId: string
  ): Promise<ExerciseLog | undefined> {
    const sessions = await this.getSessions();
    for (const session of sessions) {
      const exerciseLog = session.exercises.find(
        (e) => e.exerciseId === exerciseId
      );
      if (exerciseLog) {
        return exerciseLog;
      }
    }
    return undefined;
  },
};

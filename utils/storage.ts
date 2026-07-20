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
    weight: string;
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
const normalizeExerciseName = (n: string) => n.trim().toLowerCase();

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
      if (!data) return [];
      const parsed: WorkoutSession[] = JSON.parse(data);
      return parsed.map((session) => ({
        ...session,
        exercises: session.exercises.map((ex) => ({
          ...ex,
            sets: ex.sets.map((s) => ({
              reps: s.reps,
              weight: typeof (s as any).weight === 'number'
                ? String((s as any).weight)
                : (s as any).weight ?? '',
            })),
          })),
      }));
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

  async deleteSession(id: string): Promise<void> {
    const sessions = await this.getSessions();
    await this.saveSessions(sessions.filter((s) => s.id !== id));
  },

  async updateSession(session: WorkoutSession): Promise<void> {
    const sessions = await this.getSessions();
    const updated = sessions.map((s) => (s.id === session.id ? session : s));
    await this.saveSessions(updated);
  },

  async getSessionById(id: string): Promise<WorkoutSession | undefined> {
    const sessions = await this.getSessions();
    return sessions.find((s) => s.id === id);
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

  async getLastPerformanceByName(
    exerciseName: string
  ): Promise<ExerciseLog | undefined> {
    const target = normalizeExerciseName(exerciseName);
    const sessions = await this.getSessions();
    for (const session of sessions) {
      for (const ex of session.exercises) {
        if (normalizeExerciseName(ex.exerciseName) === target) {
          return ex; // first found = most recent (sessions list is newest first)
        }
      }
    }
    return undefined;
  },

  async getAllExerciseNames(): Promise<string[]> {
    const sessions = await this.getSessions();
    const names = new Set<string>();
    sessions.forEach((s) => {
      s.exercises.forEach((e) => {
        names.add(e.exerciseName);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  },

  async getHistoryForExercise(
    name: string
  ): Promise<{ date: string; sets: { reps: number; weight: string }[] }[]> {
    const sessions = await this.getSessions();
    const target = normalizeExerciseName(name);
    const history: {
      date: string;
      sets: { reps: number; weight: string }[];
    }[] = [];

    sessions.forEach((s) => {
      const ex = s.exercises.find(
        (e) => normalizeExerciseName(e.exerciseName) === target
      );
      if (ex) {
        history.push({
          date: s.date,
          sets: ex.sets,
        });
      }
    });

    return history;
  },
};

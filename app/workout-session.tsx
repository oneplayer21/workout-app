import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react-native';
import {
  storage,
  WorkoutPreset,
  Exercise,
  ExerciseLog,
  WorkoutSession,
} from '@/utils/storage';

interface SetInput {
  reps: string;
  weight: string;
}

interface ExerciseSessionData {
  exerciseId: string;
  exerciseName: string;
  sets: SetInput[];
  lastPerformance?: ExerciseLog;
}

export default function WorkoutSessionScreen() {
  const { presetId } = useLocalSearchParams<{ presetId: string }>();
  const router = useRouter();
  const [preset, setPreset] = useState<WorkoutPreset | null>(null);
  const [exerciseData, setExerciseData] = useState<ExerciseSessionData[]>([]);

  useEffect(() => {
    loadPreset();
  }, []);

  const loadPreset = async () => {
    const presets = await storage.getPresets();
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setPreset(found);
      await initializeExerciseData(found.exercises);
    }
  };

  const initializeExerciseData = async (exercises: Exercise[]) => {
    const data: ExerciseSessionData[] = [];
    for (const exercise of exercises) {
      const lastPerf = await storage.getLastPerformance(exercise.id);
      data.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: [{ reps: '', weight: '' }],
        lastPerformance: lastPerf,
      });
    }
    setExerciseData(data);
  };

  const addSet = (exerciseIndex: number) => {
    const newData = [...exerciseData];
    newData[exerciseIndex].sets.push({ reps: '', weight: '' });
    setExerciseData(newData);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newData = [...exerciseData];
    if (newData[exerciseIndex].sets.length > 1) {
      newData[exerciseIndex].sets.splice(setIndex, 1);
      setExerciseData(newData);
    }
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    const newData = [...exerciseData];
    newData[exerciseIndex].sets[setIndex][field] = value;
    setExerciseData(newData);
  };

  const handleFinishWorkout = async () => {
    if (!preset) return;

    const exercises: ExerciseLog[] = exerciseData
      .filter((ex) => ex.sets.some((s) => s.reps || s.weight))
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets
          .filter((s) => s.reps || s.weight)
          .map((s) => ({
            reps: parseInt(s.reps) || 0,
            weight: parseFloat(s.weight) || 0,
          })),
      }));

    if (exercises.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir au moins un exercice');
      return;
    }

    const session: WorkoutSession = {
      id: Date.now().toString(),
      presetId: preset.id,
      presetName: preset.name,
      date: new Date().toISOString(),
      exercises,
    };

    await storage.addSession(session);

    Alert.alert('Succès', 'Séance enregistrée !', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  if (!preset) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{preset.name}</Text>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishWorkout}>
          <Check size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {exerciseData.map((exercise, exerciseIndex) => (
          <View key={exercise.exerciseId} style={styles.exerciseSection}>
            <Text style={styles.exerciseTitle}>{exercise.exerciseName}</Text>

            {exercise.lastPerformance && (
              <View style={styles.lastPerformance}>
                <Text style={styles.lastPerformanceTitle}>
                  Dernière performance:
                </Text>
                {exercise.lastPerformance.sets.map((set, idx) => (
                  <Text key={idx} style={styles.lastPerformanceText}>
                    Série {idx + 1}: {set.reps} reps × {set.weight} kg
                  </Text>
                ))}
              </View>
            )}

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Reps"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(value) =>
                    updateSet(exerciseIndex, setIndex, 'reps', value)
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Kg"
                  keyboardType="decimal-pad"
                  value={set.weight}
                  onChangeText={(value) =>
                    updateSet(exerciseIndex, setIndex, 'weight', value)
                  }
                />
                <TouchableOpacity
                  onPress={() => removeSet(exerciseIndex, setIndex)}
                  style={styles.deleteSetButton}>
                  <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addSetButton}
              onPress={() => addSet(exerciseIndex)}>
              <Plus size={18} color="#2563eb" />
              <Text style={styles.addSetText}>Ajouter une série</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  finishButton: {
    backgroundColor: '#16a34a',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  exerciseSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  lastPerformance: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  lastPerformanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 6,
  },
  lastPerformanceText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: '600',
    width: 24,
    color: '#374151',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  deleteSetButton: {
    padding: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    marginTop: 4,
  },
  addSetText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
});

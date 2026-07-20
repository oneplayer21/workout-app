import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Check, History } from 'lucide-react-native';
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
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedExerciseHistory, setSelectedExerciseHistory] = useState<{
    name: string;
    history: { date: string; sets: { reps: number; weight: string }[] }[];
  } | null>(null);

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
      const lastPerf = await storage.getLastPerformanceByName(exercise.name);
      data.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        // Start with at least 2 sets
        sets: [
          { reps: '', weight: '' },
          { reps: '', weight: '' },
        ],
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
    // Keep a minimum of 2 sets
    if (newData[exerciseIndex].sets.length > 2) {
      newData[exerciseIndex].sets.splice(setIndex, 1);
      setExerciseData(newData);
    } else {
      Alert.alert('Info', 'Minimum 2 séries par exercice');
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
            // store raw string
            weight: s.weight.trim(),
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

  const openHistoryModal = async (exerciseName: string) => {
    const history = await storage.getHistoryForExercise(exerciseName);
    setSelectedExerciseHistory({ name: exerciseName, history });
    setHistoryModalVisible(true);
  };

  if (!preset) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.select({ ios: 80, android: 0 })}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{preset.name}</Text>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishWorkout}>
            <Check size={24} color="#141414" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {exerciseData.map((exercise, exerciseIndex) => (
            <View key={exercise.exerciseId} style={styles.exerciseSection}>
              <View style={styles.exerciseTitleContainer}>
                <Text style={styles.exerciseTitle}>{exercise.exerciseName}</Text>
                <TouchableOpacity
                  onPress={() => openHistoryModal(exercise.exerciseName)}
                  style={styles.historyButton}>
                  <History size={20} color="#812dcf" />
                </TouchableOpacity>
              </View>

              {exercise.lastPerformance && (
                <View style={styles.lastPerformance}>
                  <Text style={styles.lastPerformanceTitle}>
                    Dernière performance:
                  </Text>
                  {exercise.lastPerformance.sets.map((set, idx) => (
                    <Text key={idx} style={styles.lastPerformanceText}>
                      Série {idx + 1}: {set.reps} reps × {set.weight}
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
                    placeholderTextColor="#9ca3af"
                    value={set.reps}
                    onChangeText={(value) =>
                      updateSet(exerciseIndex, setIndex, 'reps', value)
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Poids (ex: 10+1.25k)"
                    keyboardType="default"
                    placeholderTextColor="#9ca3af"
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
                <Plus size={18} color="#812dcf" />
                <Text style={styles.addSetText}>Ajouter une série</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Modal
          visible={historyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setHistoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedExerciseHistory?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setHistoryModalVisible(false)}
                  style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.historyList}>
                {selectedExerciseHistory?.history.length === 0 ? (
                  <View style={styles.emptyHistory}>
                    <Text style={styles.emptyHistoryText}>
                      Aucun historique pour cet exercice
                    </Text>
                  </View>
                ) : (
                  selectedExerciseHistory?.history.map((item, index) => (
                    <View key={index} style={styles.historyCard}>
                      <Text style={styles.historyDate}>
                        {new Date(item.date).toLocaleDateString()} -{' '}
                        {new Date(item.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {item.sets.map((set, idx) => (
                        <View key={idx} style={styles.historySetRow}>
                          <Text style={styles.historySetLabel}>
                            Série {idx + 1}:
                          </Text>
                          <Text style={styles.historySetValue}>
                            {set.reps} reps × {set.weight}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
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
    color: '#ffffff',
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
    backgroundColor: '#141414',
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
    color: '#ffffff',
  },
  lastPerformance: {
    backgroundColor: '#0b1220',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  lastPerformanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 6,
  },
  lastPerformanceText: {
    fontSize: 13,
    color: '#bfdbfe',
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
    color: '#d1d5db',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#262626',
    color: '#ffffff',
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
    color: '#812dcf',
    fontWeight: '600',
    fontSize: 14,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: '300',
  },
  historyList: {
    maxHeight: 400,
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  historySetRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  historySetLabel: {
    color: '#9ca3af',
    width: 70,
  },
  historySetValue: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

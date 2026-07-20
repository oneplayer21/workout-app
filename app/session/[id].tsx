import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { storage, WorkoutSession, ExerciseLog } from '@/utils/storage';

type SetInput = { reps: string; weight: string };

export default function EditSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<
    { exerciseId: string; exerciseName: string; sets: SetInput[] }[]
  >([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const all = await storage.getSessions();
      const s = all.find((x) => x.id === id) || null;
      if (!s) {
        Alert.alert('Introuvable', 'Séance introuvable', [{ text: 'OK', onPress: () => router.back() }]);
        return;
      }
      setSession(s);
      setExercises(
        s.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: ex.sets.map((set) => ({
            reps: String(set.reps ?? ''),
            weight: String(set.weight ?? ''),
          })),
        }))
      );
    })();
  }, [id]);

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', value: string) => {
    const next = [...exercises];
    next[exIdx].sets[setIdx][field] = value;
    setExercises(next);
  };

  const addSet = (exIdx: number) => {
    const next = [...exercises];
    next[exIdx].sets.push({ reps: '', weight: '' });
    setExercises(next);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    const next = [...exercises];
    if (next[exIdx].sets.length > 1) next[exIdx].sets.splice(setIdx, 1);
    setExercises(next);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newExercises.length) return;

    // Swap
    [newExercises[index], newExercises[targetIndex]] = [
      newExercises[targetIndex],
      newExercises[index],
    ];
    setExercises(newExercises);
  };

  const removeExercise = (index: number) => {
    Alert.alert('Retirer', 'Retirer cet exercice de la séance ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () => {
          const next = [...exercises];
          next.splice(index, 1);
          setExercises(next);
        },
      },
    ]);
  };

  const onSave = async () => {
    if (!session) return;
    const updatedExercises: ExerciseLog[] = exercises
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets
          .filter((s) => s.reps || s.weight)
          .map((s) => ({
            reps: parseInt(s.reps) || 0,
            // keep as string
            weight: s.weight.trim(),
          })),
      }))
      .filter((ex) => ex.sets.length > 0);

    if (updatedExercises.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir au moins une série');
      return;
    }

    const updated: WorkoutSession = { ...session, exercises: updatedExercises };
    await storage.updateSession(updated);
    Alert.alert('Succès', 'Séance mise à jour', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const onDelete = async () => {
    if (!session) return;
    Alert.alert('Supprimer', 'Supprimer cette séance ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await storage.deleteSession(session.id);
          router.back();
        },
      },
    ]);
  };

  if (!session) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#fff' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier: {session.presetName}</Text>
        <TouchableOpacity style={styles.finishButton} onPress={onSave}>
          <Check size={24} color="#141414" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.exerciseId} style={styles.exerciseSection}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
              <Text style={styles.exerciseTitle}>{exercise.exerciseName}</Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => moveExercise(exerciseIndex, 'up')}
                  disabled={exerciseIndex === 0}
                  style={{ opacity: exerciseIndex === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveExercise(exerciseIndex, 'down')}
                  disabled={exerciseIndex === exercises.length - 1}
                  style={{
                    opacity: exerciseIndex === exercises.length - 1 ? 0.3 : 1,
                  }}>
                  <ChevronDown size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeExercise(exerciseIndex)}
                  style={{ paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#374151' }}>
                  <Trash2 size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Reps"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'reps', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Poids (ex: 10+1.25k)"
                  placeholderTextColor="#9ca3af"
                  keyboardType="default"
                  value={set.weight}
                  onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'weight', v)}
                />
                <TouchableOpacity onPress={() => removeSet(exerciseIndex, setIndex)} style={{ padding: 8 }}>
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

        <TouchableOpacity
          onPress={onDelete}
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: '#450a0a',
            borderRadius: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#dc2626',
          }}>
          <Text style={{ color: '#fca5a5', fontWeight: '700' }}>
            Supprimer la séance complète
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#262626' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#141414', borderBottomWidth: 1, borderBottomColor: '#262626',
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 12, color: '#ffffff' },
  finishButton: { backgroundColor: '#16a34a', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  exerciseSection: {
    backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  exerciseTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#ffffff' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  setNumber: { fontSize: 16, fontWeight: '600', width: 24, color: '#d1d5db' },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 10, fontSize: 16,
    backgroundColor: '#262626', color: '#ffffff',
  },
  addSetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6, marginTop: 4 },
  addSetText: { color: '#812dcf', fontWeight: '600', fontSize: 14 },
});
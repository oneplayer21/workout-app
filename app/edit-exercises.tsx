import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react-native';
import { storage, WorkoutPreset, Exercise } from '@/utils/storage';

export default function EditExercisesScreen() {
  const { presetId } = useLocalSearchParams<{ presetId: string }>();
  const router = useRouter();
  const [preset, setPreset] = useState<WorkoutPreset | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');

  useEffect(() => {
    loadPreset();
  }, []);

  const loadPreset = async () => {
    const presets = await storage.getPresets();
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setPreset(found);
    }
  };

  const handleAddExercise = async () => {
    if (!exerciseName.trim() || !preset) {
      return;
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      notes: exerciseNotes.trim() || undefined,
    };

    const updatedPreset = {
      ...preset,
      exercises: [...preset.exercises, newExercise],
    };

    await storage.updatePreset(updatedPreset);
    setPreset(updatedPreset);
    setModalVisible(false);
    setExerciseName('');
    setExerciseNotes('');
  };

  const moveExercise = async (index: number, direction: 'up' | 'down') => {
    if (!preset) return;
    const newExercises = [...preset.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newExercises.length) return;

    // Swap
    [newExercises[index], newExercises[targetIndex]] = [
      newExercises[targetIndex],
      newExercises[index],
    ];

    const updatedPreset = { ...preset, exercises: newExercises };
    await storage.updatePreset(updatedPreset);
    setPreset(updatedPreset);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!preset) return;

    const updatedPreset = {
      ...preset,
      exercises: preset.exercises.filter((e) => e.id !== exerciseId),
    };

    await storage.updatePreset(updatedPreset);
    setPreset(updatedPreset);
  };

  const renderExercise = ({ item, index }: { item: Exercise; index: number }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        {item.notes && <Text style={styles.exerciseNotes}>{item.notes}</Text>}
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <TouchableOpacity
          onPress={() => moveExercise(index, 'up')}
          disabled={index === 0}
          style={{ padding: 4, opacity: index === 0 ? 0.3 : 1 }}>
          <ChevronUp size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => moveExercise(index, 'down')}
          disabled={!preset || index === preset.exercises.length - 1}
          style={{ padding: 4, opacity: (!preset || index === preset.exercises.length - 1) ? 0.3 : 1 }}>
          <ChevronDown size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteExercise(item.id)}
          style={[styles.deleteButton, { marginLeft: 8, borderLeftWidth: 1, borderLeftColor: '#374151', paddingLeft: 8 }]}>
          <Trash2 size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{preset.name}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}>
          <Plus size={24} color="#141414" />
        </TouchableOpacity>
      </View>

      {preset.exercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun exercice</Text>
          <Text style={styles.emptySubtext}>
            Ajoutez des exercices à ce preset
          </Text>
        </View>
      ) : (
        <FlatList
          data={preset.exercises}
          renderItem={renderExercise}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvel Exercice</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'exercice"
              placeholderTextColor="#9ca3af"
              value={exerciseName}
              onChangeText={setExerciseName}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optionnel)"
              placeholderTextColor="#9ca3af"
              value={exerciseNotes}
              onChangeText={setExerciseNotes}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setExerciseName('');
                  setExerciseNotes('');
                }}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddExercise}>
                <Text style={styles.saveButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  addButton: {
    backgroundColor: '#812dcf',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  exerciseCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#ffffff',
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#9ca3af',
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#262626',
    color: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#812dcf',
  },
  saveButtonText: {
    color: '#141414',
    fontWeight: '600',
    fontSize: 16,
  },
});

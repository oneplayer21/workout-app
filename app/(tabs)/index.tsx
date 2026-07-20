import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Plus, Edit2, Trash2, Play } from 'lucide-react-native';
import { storage, WorkoutPreset } from '@/utils/storage';
import { useRouter } from 'expo-router';

export default function WorkoutsScreen() {
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<WorkoutPreset | null>(
    null
  );
  const [presetName, setPresetName] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    const data = await storage.getPresets();
    setPresets(data);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      return;
    }

    if (editingPreset) {
      const updated = { ...editingPreset, name: presetName };
      await storage.updatePreset(updated);
    } else {
      const newPreset: WorkoutPreset = {
        id: Date.now().toString(),
        name: presetName,
        exercises: [],
        createdAt: new Date().toISOString(),
      };
      await storage.addPreset(newPreset);
    }

    setModalVisible(false);
    setPresetName('');
    setEditingPreset(null);
    loadPresets();
  };

  const handleDeletePreset = async (id: string) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer ce preset ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await storage.deletePreset(id);
            loadPresets();
          },
        },
      ]
    );
  };

  const openEditModal = (preset: WorkoutPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingPreset(null);
    setPresetName('');
    setModalVisible(true);
  };

  const startWorkout = (preset: WorkoutPreset) => {
    router.push({
      pathname: '/workout-session',
      params: { presetId: preset.id },
    });
  };

  const editExercises = (preset: WorkoutPreset) => {
    router.push({
      pathname: '/edit-exercises',
      params: { presetId: preset.id },
    });
  };

  const renderPreset = ({ item }: { item: WorkoutPreset }) => (
    <View style={styles.presetCard}>
      <View style={styles.presetHeader}>
        <Text style={styles.presetName}>{item.name}</Text>
        <View style={styles.presetActions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.iconButton}>
            <Edit2 size={20} color="#812dcf" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeletePreset(item.id)}
            style={styles.iconButton}>
            <Trash2 size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.exerciseCount}>
        {item.exercises.length} exercice(s)
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.editExercisesButton]}
          onPress={() => editExercises(item)}>
          <Text style={styles.editExercisesButtonText}>
            Modifier exercices
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={() => startWorkout(item)}>
          <Play size={16} color="#141414" />
          <Text style={styles.startButtonText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Entraînements</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}>
          <Plus size={24} color="#141414" />
        </TouchableOpacity>
      </View>

      {presets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucun preset d'entraînement
          </Text>
          <Text style={styles.emptySubtext}>
            Créez votre premier preset pour commencer
          </Text>
        </View>
      ) : (
        <FlatList
          data={presets}
          renderItem={renderPreset}
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
            <Text style={styles.modalTitle}>
              {editingPreset ? 'Modifier' : 'Nouveau'} Preset
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du preset"
              value={presetName}
              onChangeText={setPresetName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePreset}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
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
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
  presetCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#ffffff',
  },
  presetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  exerciseCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editExercisesButton: {
    backgroundColor: '#262626',
  },
  editExercisesButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  startButton: {
    backgroundColor: '#812dcf',
  },
  startButtonText: {
    color: '#141414',
    fontWeight: '600',
    fontSize: 14,
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
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
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
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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

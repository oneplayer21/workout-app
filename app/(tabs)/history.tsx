import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { storage, WorkoutSession } from '@/utils/storage';

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  const load = async () => {
    const all = await storage.getSessions();
    setSessions([...all].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const confirmDelete = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette séance ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => { await storage.deleteSession(id); await load(); },
      },
    ]);
  };

  const renderItem = ({ item }: { item: WorkoutSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{item.presetName}</Text>
          <Text style={styles.sessionDate}>{new Date(item.date).toLocaleString()}</Text>
          <Text style={styles.exerciseCount}>
            {item.exercises.length} exercices · {item.exercises.reduce((a, e) => a + e.sets.length, 0)} séries
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push(`/session/${item.id}`)}>
            <Pencil size={20} color="#812dcf" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => confirmDelete(item.id)}>
            <Trash2 size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Historique</Text></View>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune séance enregistrée</Text>
            <Text style={styles.emptySubtext}>Vos séances apparaîtront ici</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#262626' },
  header: {
    padding: 20, paddingTop: 60, backgroundColor: '#141414',
    borderBottomWidth: 1, borderBottomColor: '#262626',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff' },
  list: { padding: 16 },
  sessionCard: {
    backgroundColor: '#141414', borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  sessionInfo: { flex: 1, paddingRight: 8 },
  sessionName: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: '#ffffff' },
  sessionDate: { fontSize: 14, color: '#9ca3af', marginBottom: 4 },
  exerciseCount: { fontSize: 13, color: '#9ca3af' },
  iconButton: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#d1d5db', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});

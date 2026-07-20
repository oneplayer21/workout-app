import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { storage } from '@/utils/storage';

export default function ExerciseHistoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const [history, setHistory] = useState<{ date: string; sets: { reps: number; weight: string }[] }[]>([]);

  useEffect(() => {
    if (name) {
      load();
    }
  }, [name]);

  const load = async () => {
    if (!name) return;
    const data = await storage.getHistoryForExercise(name);
    setHistory(data);
  };

  const renderItem = ({ item }: { item: { date: string; sets: { reps: number; weight: string }[] } }) => (
    <View style={styles.card}>
      <Text style={styles.date}>{new Date(item.date).toLocaleDateString()} - {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      {item.sets.map((set, idx) => (
        <View key={idx} style={styles.setRow}>
          <Text style={styles.setLabel}>Série {idx + 1}:</Text>
          <Text style={styles.setValue}>
            {set.reps} reps × {set.weight}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{name}</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun historique pour cet exercice</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#262626' },
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
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff', flex: 1, textAlign: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  date: { fontSize: 14, color: '#9ca3af', marginBottom: 12 },
  setRow: { flexDirection: 'row', marginBottom: 4 },
  setLabel: { color: '#9ca3af', width: 60 },
  setValue: { color: '#ffffff', fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
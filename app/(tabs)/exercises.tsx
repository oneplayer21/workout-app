import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { storage } from '@/utils/storage';

export default function ExercisesScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        try {
          const names = await storage.getAllExerciseNames();
          if (isActive) {
            setExercises(names);
          }
        } catch (err) {
          console.error('Failed to load exercises', err);
        }
      };

      load();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/exercise-history/[name]' as const,
          params: { name: item },
        })
      }>
      <Text style={styles.name}>{item}</Text>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercices</Text>
      </View>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun exercice enregistré</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#262626' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
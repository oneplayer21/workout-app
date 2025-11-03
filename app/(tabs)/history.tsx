import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { storage, WorkoutSession } from '@/utils/storage';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await storage.getSessions();
    setSessions(data);
  };

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const renderSession = ({ item }: { item: WorkoutSession }) => {
    const isExpanded = expandedSessions.has(item.id);

    return (
      <View style={styles.sessionCard}>
        <TouchableOpacity
          onPress={() => toggleSession(item.id)}
          style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{item.presetName}</Text>
            <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
            <Text style={styles.exerciseCount}>
              {item.exercises.length} exercice(s)
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={24} color="#6b7280" />
          ) : (
            <ChevronDown size={24} color="#6b7280" />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sessionDetails}>
            {item.exercises.map((exercise, idx) => (
              <View key={idx} style={styles.exerciseDetail}>
                <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                {exercise.sets.map((set, setIdx) => (
                  <View key={setIdx} style={styles.setDetail}>
                    <Text style={styles.setNumber}>Série {setIdx + 1}:</Text>
                    <Text style={styles.setText}>
                      {set.reps} reps × {set.weight} kg
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucune séance enregistrée</Text>
          <Text style={styles.emptySubtext}>
            Vos séances apparaîtront ici après les avoir complétées
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  list: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
  sessionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    paddingTop: 12,
  },
  exerciseDetail: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  setDetail: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingLeft: 12,
  },
  setNumber: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  setText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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
});

import { Tabs } from 'expo-router';
import { Dumbbell, History, List } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#812dcf',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#141414', borderTopColor: '#262626' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Entraînements',
          tabBarIcon: ({ size, color }) => (
            <Dumbbell size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercices',
          tabBarIcon: ({ size, color }) => (
            <List size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

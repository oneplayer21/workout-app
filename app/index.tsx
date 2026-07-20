import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout App</Text>

      <Link href="/(tabs)" asChild>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Start session</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/history" asChild>
        <TouchableOpacity style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>History</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#262626' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#ffffff' },
  btn: { backgroundColor: '#812dcf', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: 220, alignItems: 'center' },
  btnText: { color: '#141414', fontWeight: '700' },
  secondaryBtn: { borderColor: '#812dcf', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, width: 220, alignItems: 'center' },
  secondaryText: { color: '#812dcf', fontWeight: '700' },
});
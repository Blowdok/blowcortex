import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BlowCortex</Text>
      <Text style={styles.subtitle}>
        Application mobile — squelette Sprint 1.
      </Text>
      <Text style={styles.note}>
        L&rsquo;auth Clerk, le feed et les briefings arrivent à partir du Sprint 4.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
    gap: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
  },
  note: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
});

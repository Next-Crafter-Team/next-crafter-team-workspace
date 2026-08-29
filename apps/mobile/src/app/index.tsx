import { useBusinessAuth } from '@workspace/auth/client';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Proves the whole identity chain end to end: Clerk session -> JWT validated by
 * Convex -> `users` row -> agnostic user read back through a Convex query.
 *
 * Intentionally plain. The map-vs-feed product decision is still open
 * (apps/mobile/CONTRACT.md), so this screen stays a probe, not a design.
 */
export default function Home() {
  const auth = useBusinessAuth();

  if (auth.isLoading()) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color="#E3432A" />
      </SafeAreaView>
    );
  }

  const user = auth.getCurrentUser();

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Cementerio de Ideas</Text>

      {auth.isSignedIn() && user ? (
        <View style={styles.block}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{user.email}</Text>
          <Text style={styles.label}>Convex user id</Text>
          <Text style={styles.mono}>{user.id}</Text>
          <Pressable style={styles.button} onPress={() => void auth.signOut()}>
            <Text style={styles.buttonText}>Sign out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.label}>Browsing as a visitor</Text>
          <Pressable style={styles.button} onPress={auth.openSignIn}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0808' },
  title: { color: '#F3E9E1', fontSize: 22, marginBottom: 32 },
  block: { alignItems: 'center', gap: 6 },
  label: { color: '#A8938C', fontSize: 12, marginTop: 12 },
  value: { color: '#F3E9E1', fontSize: 16 },
  mono: { color: '#FCA35D', fontSize: 12, fontFamily: 'monospace' },
  button: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 6,
    backgroundColor: '#E3432A',
  },
  buttonText: { color: '#F3E9E1', fontSize: 15, fontWeight: '600' },
});

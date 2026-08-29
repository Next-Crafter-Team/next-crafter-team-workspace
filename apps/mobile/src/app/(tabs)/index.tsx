import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { BottomTabInset } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <View style={styles.brandRow}>
            <View style={styles.mark} />
            <Text style={styles.brand}>Cementerio de Ideas</Text>
          </View>

          <Text style={styles.tagline}>
            Los proyectos que abandonaste no desaparecen. Se entierran, se les hace la autopsia
            {'\n'}y alguien puede resucitarlos.
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
              onPress={() => router.push('/explore')}>
              <Text style={styles.btnPrimaryText}>Explorar el cementerio</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && styles.pressed]}
              onPress={() => router.push('/login')}>
              <Text style={styles.btnGhostText}>Entrar a mi panel</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>Fase actual: solo GitHub · autenticación con Clerk</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingBottom: BottomTabInset, paddingHorizontal: 28 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 10, height: 10, borderRadius: 3, backgroundColor: C.ember },
  brand: { fontFamily: F.serif, fontSize: 26, fontWeight: '500', color: C.bone },
  tagline: {
    fontFamily: F.sans,
    fontSize: 14,
    lineHeight: 22,
    color: C.stone,
    textAlign: 'center',
    maxWidth: 340,
  },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 8, maxWidth: 360, width: '100%' },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.ember },
  btnPrimaryText: { color: '#1A0908', fontWeight: '700', fontSize: 14, fontFamily: F.sans },
  btnGhost: { borderWidth: 1, borderColor: C.line, backgroundColor: C.bgCard },
  btnGhostText: { color: C.bone, fontWeight: '600', fontSize: 14, fontFamily: F.sans },
  pressed: { opacity: 0.7 },
  footer: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.stoneDim,
    textAlign: 'center',
    paddingBottom: 8,
  },
});

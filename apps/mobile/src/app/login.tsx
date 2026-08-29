import { useBusinessAuth } from '@workspace/auth/client';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';

export default function LoginScreen() {
  const router = useRouter();
  const auth = useBusinessAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Only a real Clerk session opens the panel. The redirect waits for the
  // session instead of firing on button press, so a cancelled sign-in leaves
  // the user here rather than inside a panel they never authenticated for.
  useEffect(() => {
    if (auth.isSignedIn()) router.replace('/admin' as Href);
  }, [auth, router]);

  const enter = () => auth.openSignIn();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.back}>&#8592;  Volver</Text>
            </Pressable>
          </View>

          <View style={styles.center}>
            <View style={styles.card}>
              <View style={styles.brandRow}>
                <View style={styles.mark} />
                <Text style={styles.brand}>Cementerio de Ideas</Text>
              </View>

              <Text style={styles.title}>Entrá a tu panel</Text>
              <Text style={styles.sub}>
                Gestioná tus proyectos enterrados, tus recordatorios y lo que guardaste para
                reclamar.
              </Text>

              <Pressable
                style={({ pressed }) => [styles.ghBtn, pressed && styles.pressed]}
                onPress={enter}>
                <Text style={styles.ghBtnText}>&#9670;  Continuar con Google</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>o con email</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vos@ejemplo.com"
                  placeholderTextColor={C.stoneDim}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={C.stoneDim}
                  secureTextEntry
                  style={styles.input}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.enterBtn, pressed && styles.pressed]}
                onPress={enter}>
                <Text style={styles.enterBtnText}>Entrar</Text>
              </Pressable>

              <Text style={styles.note}>Maqueta — sin autenticación real todavía (irá con Clerk).</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  topRow: { paddingHorizontal: 20, paddingTop: 8 },
  back: { color: C.stone, fontSize: 13, fontFamily: F.sans, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  mark: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.ember },
  brand: { fontFamily: F.serif, fontSize: 14, fontWeight: '500', color: C.bone },
  title: { fontFamily: F.serif, fontSize: 24, fontWeight: '500', color: C.bone },
  sub: { fontFamily: F.sans, fontSize: 12.5, lineHeight: 19, color: C.stone, marginBottom: 6 },
  ghBtn: {
    backgroundColor: C.ember,
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ghBtnText: { color: '#1A0908', fontWeight: '700', fontSize: 13.5, fontFamily: F.sans },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { color: C.stoneDim, fontSize: 10.5, fontFamily: F.sans },
  field: { gap: 6 },
  label: { color: C.bone, fontSize: 12, fontWeight: '500', fontFamily: F.sans },
  input: {
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: C.bone,
    fontSize: 13,
    fontFamily: F.sans,
  },
  enterBtn: {
    borderWidth: 1,
    borderColor: C.ember,
    backgroundColor: C.emberDim,
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  enterBtnText: { color: C.bone, fontWeight: '600', fontSize: 13.5, fontFamily: F.sans },
  note: { color: C.stoneDim, fontSize: 10.5, fontFamily: F.sans, textAlign: 'center', marginTop: 4 },
  pressed: { opacity: 0.75 },
});

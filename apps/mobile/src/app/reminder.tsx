import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { findMyIdea } from '@/data/panel';

/**
 * Pantalla de un recordatorio. Es a donde llega el usuario desde la
 * notificación del cron ("¿Seguís con X, o lo enterramos?") y desde la
 * tarjeta de la idea en "Mis ideas". Los recordatorios se gestionan por idea:
 * esta pantalla siempre corresponde a un `repositoryId`.
 */
export default function ReminderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const idea = findMyIdea(id);
  const reminder = idea?.reminder;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/admin' as Href));

  if (!idea || !reminder) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
          <Pressable onPress={close} hitSlop={12} style={styles.backRow}>
            <Text style={styles.back}>←  Recordatorio</Text>
          </Pressable>
          <View style={styles.center}>
            <Text style={styles.emptyText}>Este recordatorio ya no está activo.</Text>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={close}>
              <Text style={styles.btnGhostText}>Volver</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { step, inactiveLabel, timesAskedLabel, keepEveryLabel } = reminder;
  const isLast = step === 3;

  const respond = (action: 'keep' | 'snooze' | 'bury') => {
    const messages: Record<'keep' | 'snooze' | 'bury', [string, string]> = {
      keep: [
        'Seguís con esto',
        `Reiniciamos el contador y te volvemos a preguntar en ${keepEveryLabel}.`,
      ],
      snooze: ['Pospuesto una semana', 'El contador queda como está; te avisamos de nuevo pronto.'],
      bury: [
        'Enterrado en el cementerio',
        'La idea pasa a enterrada y generamos un borrador de autopsia desde tu historial de commits. Lo revisás antes de publicar.',
      ],
    };
    const [t, m] = messages[action];
    Alert.alert(t, m, [{ text: 'Listo', onPress: close }]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <Pressable onPress={close} hitSlop={12} style={styles.backRow}>
          <Text style={styles.back}>←  Recordatorio</Text>
        </Pressable>

        <View style={styles.body}>
          <View style={styles.graveWrap}>
            <View style={styles.grave}>
              <Text style={styles.graveRip}>R.I.P.?</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>
            RECORDATORIO {step} DE 3{isLast ? ' · ÚLTIMA VEZ' : ''}
          </Text>

          <Text style={styles.title}>¿Seguís con {idea.title}, o lo enterramos?</Text>

          <Text style={styles.lead}>
            {inactiveLabel}. {timesAskedLabel}.
          </Text>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnKeep]} onPress={() => respond('keep')}>
              <Text style={styles.btnKeepText}>Sigo con esto — recordar en {keepEveryLabel}</Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => respond('snooze')}>
              <Text style={styles.btnGhostText}>Posponer una semana más</Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.btnBury]} onPress={() => respond('bury')}>
              <Text style={styles.btnBuryText}>Enterrarlo en el cementerio</Text>
            </Pressable>
          </View>

          <Text style={styles.footnote}>
            Si lo enterrás, generamos un borrador de autopsia desde tu historial de commits para que
            no arranques de cero.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingHorizontal: 22 },
  backRow: { paddingTop: 6, paddingBottom: 4 },
  back: { fontFamily: F.serif, fontSize: 16, fontWeight: '500', color: C.bone },

  body: { flex: 1, justifyContent: 'center', gap: 14, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 13, color: C.stone, fontFamily: F.sans },

  graveWrap: { alignItems: 'center', marginBottom: 6 },
  grave: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.ember,
    backgroundColor: C.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graveRip: { fontFamily: F.serif, fontSize: 17, color: C.ember, letterSpacing: 1 },

  eyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.ember,
    fontFamily: F.sans,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    fontFamily: F.serif,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    color: C.bone,
    textAlign: 'center',
  },
  lead: {
    fontSize: 13,
    lineHeight: 20,
    color: C.stone,
    fontFamily: F.sans,
    textAlign: 'center',
    marginBottom: 8,
  },

  actions: { gap: 10 },
  btn: { borderRadius: 9, paddingVertical: 14, alignItems: 'center', paddingHorizontal: 12 },
  btnKeep: { backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.line },
  btnKeepText: { color: C.bone, fontSize: 13, fontWeight: '600', fontFamily: F.sans },
  btnGhost: { borderWidth: 1, borderColor: C.line },
  btnGhostText: { color: C.stone, fontSize: 13, fontWeight: '500', fontFamily: F.sans },
  btnBury: { backgroundColor: C.ember },
  btnBuryText: { color: '#1A0908', fontSize: 13, fontWeight: '700', fontFamily: F.sans },

  footnote: {
    fontSize: 10.5,
    lineHeight: 15,
    color: C.stoneDim,
    fontFamily: F.sans,
    textAlign: 'center',
    marginTop: 8,
  },
});

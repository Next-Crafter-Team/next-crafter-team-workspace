import { StyleSheet, Text, View } from 'react-native';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { STATE_LABEL, type Grave, type GraveState } from '@/data/graves';

function StatePill({ state }: { state: GraveState }) {
  const styleByState: Record<GraveState, { box: object; text: string; dot: string }> = {
    buried: { box: styles.pillBuried, text: C.ember, dot: C.ember },
    latent: { box: styles.pillLatent, text: C.stone, dot: C.stoneDim },
    reminder: { box: styles.pillReminder, text: C.gold, dot: C.gold },
    revived: { box: styles.pillRevived, text: C.gold, dot: C.gold },
  };
  const s = styleByState[state];
  return (
    <View style={[styles.pill, s.box]}>
      <View style={[styles.pillDot, { backgroundColor: s.dot }]} />
      <Text style={[styles.pillText, { color: s.text }]}>{STATE_LABEL[state]}</Text>
    </View>
  );
}

export function GraveCard({ grave }: { grave: Grave }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <StatePill state={grave.state} />
        <Text style={styles.buried}>&#9760;  {grave.buried}</Text>
      </View>

      <Text style={styles.title}>{grave.title}</Text>

      {grave.repo ? (
        <Text style={styles.repo} numberOfLines={1}>
          <Text style={styles.repoAccent}>{grave.repo}</Text>
        </Text>
      ) : null}

      <Text style={styles.whyLabel}>POR QUÉ MURIÓ</Text>
      <Text style={styles.why} numberOfLines={5}>
        {grave.why}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.react}>
          &#128367;  <Text style={styles.reactNum}>{grave.reactions}</Text> reacciones
        </Text>
        <Text style={styles.tapHint}>Tocá para la autopsia</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    padding: 22,
    gap: 12,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  pillBuried: { borderColor: C.ember, backgroundColor: 'rgba(227,67,42,0.10)' },
  pillLatent: { borderColor: C.stoneDim, backgroundColor: 'transparent' },
  pillReminder: { borderColor: C.gold, backgroundColor: 'rgba(252,163,93,0.06)', borderStyle: 'dashed' },
  pillRevived: { borderColor: C.gold, backgroundColor: 'rgba(252,163,93,0.10)' },
  buried: { fontSize: 11, color: C.stoneDim, fontFamily: F.sans },
  title: {
    fontFamily: F.serif,
    fontSize: 23,
    lineHeight: 28,
    color: C.bone,
    fontWeight: '500',
  },
  repo: { fontFamily: F.mono, fontSize: 12, color: C.stone },
  repoAccent: { color: C.gold },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: C.bg,
  },
  chipText: { fontSize: 10, color: C.stone, fontFamily: F.sans },
  chipTextMono: { fontSize: 10, color: C.stone, fontFamily: F.mono },
  whyLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: C.gold,
    fontFamily: F.sans,
    fontWeight: '600',
  },
  why: { fontSize: 14, lineHeight: 22, color: C.bodyText, fontFamily: F.sans },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  react: { fontSize: 12, color: C.stone, fontFamily: F.sans },
  reactNum: { color: C.bone, fontWeight: '600' },
  tapHint: { fontSize: 10, color: C.stoneDim, fontFamily: F.sans },
});

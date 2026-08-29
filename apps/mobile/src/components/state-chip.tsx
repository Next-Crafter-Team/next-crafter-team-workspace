import { StyleSheet, Text, View } from 'react-native';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import type { GraveState } from '@/data/graves';

const MAP: Record<GraveState, { color: string; dot: string; box: object }> = {
  buried: { color: C.ember, dot: C.ember, box: { borderColor: C.ember, backgroundColor: 'rgba(227,67,42,0.10)' } },
  latent: { color: C.stone, dot: C.stoneDim, box: { borderColor: C.stoneDim } },
  reminder: {
    color: C.gold,
    dot: C.gold,
    box: { borderColor: C.gold, backgroundColor: 'rgba(252,163,93,0.06)', borderStyle: 'dashed' as const },
  },
  revived: {
    color: C.gold,
    dot: C.gold,
    box: {
      borderColor: C.gold,
      backgroundColor: 'rgba(252,163,93,0.10)',
      shadowColor: C.gold,
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
  },
};

export function StateChip({ state, label }: { state: GraveState; label: string }) {
  const s = MAP[state];
  return (
    <View style={[styles.chip, s.box]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text style={[styles.text, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 9,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: F.sans },
});

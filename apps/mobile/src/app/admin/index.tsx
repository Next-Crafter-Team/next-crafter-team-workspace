import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateChip } from '@/components/state-chip';
import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { LINEAGE, MY_IDEAS, REMINDERS, SAVED_IDEAS } from '@/data/panel';

type Section = 'ideas' | 'reminders' | 'saved' | 'lineage';

const TABS: { key: Section; label: string }[] = [
  { key: 'ideas', label: 'Mis ideas' },
  { key: 'reminders', label: 'Recordatorios' },
  { key: 'saved', label: 'Guardadas' },
  { key: 'lineage', label: 'Mi linaje' },
];

export default function AdminPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('ideas');
  const [visibility, setVisibility] = useState<Record<string, 'private' | 'public'>>(
    Object.fromEntries(MY_IDEAS.map((i) => [i.id, i.visibility])),
  );

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.mark} />
            <Text style={styles.brand}>Panel del creador</Text>
          </View>
          <Pressable onPress={exit} hitSlop={10}>
            <Text style={styles.exit}>Salir</Text>
          </Pressable>
        </View>

        {/* tabs */}
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabs}
            contentContainerStyle={styles.tabsContent}>
            {TABS.map((t) => {
              const active = t.key === section;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setSection(t.key)}
                  style={[styles.tab, active && styles.tabActive]}>
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: 96 + insets.bottom }]}
          showsVerticalScrollIndicator={false}>
          {section === 'ideas' &&
            MY_IDEAS.map((idea) => {
              const vis = visibility[idea.id];
              return (
                <View key={idea.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{idea.title}</Text>
                  <Text style={styles.cardRepo}>{idea.repo}</Text>
                  <View style={styles.cardRow}>
                    <StateChip state={idea.state} label={idea.stateLabel} />
                    <View style={styles.modeToggle}>
                      <Pressable
                        onPress={() => setVisibility((v) => ({ ...v, [idea.id]: 'private' }))}
                        style={[styles.modeBtn, vis === 'private' && styles.modePriv]}>
                        <Text style={[styles.modeText, vis === 'private' && styles.modeTextPriv]}>
                          Priv
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setVisibility((v) => ({ ...v, [idea.id]: 'public' }))}
                        style={[styles.modeBtn, vis === 'public' && styles.modePub]}>
                        <Text style={[styles.modeText, vis === 'public' && styles.modeTextPub]}>
                          Público
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.cardActivity}>{idea.activity}</Text>
                </View>
              );
            })}

          {section === 'reminders' &&
            REMINDERS.map((r) => {
              const last = r.step === 3;
              return (
                <View key={r.id} style={[styles.card, last && styles.cardLast]}>
                  <Text style={styles.remRepo}>{r.repo}</Text>
                  <Text style={styles.remIdea}>
                    {r.idea} · {r.detail}
                  </Text>
                  <View style={styles.meter}>
                    {[1, 2, 3].map((n) => (
                      <View
                        key={n}
                        style={[
                          styles.meterSeg,
                          n <= r.step && (last ? styles.meterSegEmber : styles.meterSegGold),
                        ]}
                      />
                    ))}
                    <Text style={styles.meterLabel}>{r.step} / 3</Text>
                  </View>

                  {last && (
                    <View style={styles.alert}>
                      <Text style={styles.alertText}>
                        <Text style={styles.alertStrong}>Último aviso. </Text>
                        Enterrar genera un borrador de autopsia automático que revisás antes de
                        publicar.
                      </Text>
                    </View>
                  )}

                  <View style={styles.remActions}>
                    <Pressable
                      style={[styles.remBtn, styles.remKeep]}
                      onPress={() => Alert.alert('Recordatorio pospuesto', 'Contador reseteado y reprogramado lejos.')}>
                      <Text style={styles.remKeepText}>Sigo con esto</Text>
                    </Pressable>
                    {!last && (
                      <Pressable
                        style={styles.remBtn}
                        onPress={() => Alert.alert('Pospuesto', 'Se reprograma pronto sin resetear el contador.')}>
                        <Text style={styles.remBtnText}>Posponer</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.remBtn, styles.remBury]}
                      onPress={() =>
                        Alert.alert(
                          'Enterrar ahora',
                          'La idea pasa a enterrada y se genera el borrador de autopsia.',
                        )
                      }>
                      <Text style={styles.remBuryText}>
                        {last ? 'Enterrar y generar autopsia' : 'Enterrar ahora'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

          {section === 'saved' &&
            SAVED_IDEAS.map((s) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardRepo}>{s.repo}</Text>
                <View style={styles.savedRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipMono}>{s.stack}</Text>
                  </View>
                  <Text style={styles.savedMeta}>{s.meta}</Text>
                </View>
                <Pressable
                  style={styles.reviveBtn}
                  onPress={() => Alert.alert('Reclamar y resucitar', 'Heredás la autopsia, los artefactos y el linaje. El creador original recibe una notificación.')}>
                  <Text style={styles.reviveBtnText}>Reclamar y resucitar  →</Text>
                </Pressable>
              </View>
            ))}

          {section === 'lineage' && (
            <View style={styles.timeline}>
              {LINEAGE.map((l) => (
                <View key={l.id} style={styles.tlItem}>
                  <View style={[styles.tlDot, l.glow && styles.tlDotGlow]} />
                  <Text style={styles.tlTitle}>{l.title}</Text>
                  <Text style={styles.tlRepo}>{l.repo}</Text>
                  <Text style={styles.tlWhat}>{l.what}</Text>
                  <Text style={styles.tlWho}>{l.who}</Text>
                  <Text style={styles.tlWhen}>{l.when}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* sticky CTA */}
        <View style={[styles.sticky, { paddingBottom: 14 + insets.bottom }]}>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => Alert.alert('Importar de GitHub', 'Conectás con Clerk y elegís qué repos traer al cementerio.')}>
            <Text style={styles.ctaText}>Importar de GitHub</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.ember },
  brand: { fontFamily: F.serif, fontSize: 16, fontWeight: '500', color: C.bone },
  exit: { color: C.stone, fontSize: 13, fontWeight: '500', fontFamily: F.sans },

  tabsWrap: { height: 44 },
  tabs: { flexGrow: 0 },
  tabsContent: { gap: 7, paddingHorizontal: 18, paddingVertical: 4, alignItems: 'center' },
  tab: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: C.bgCard,
  },
  tabActive: { borderColor: C.ember, backgroundColor: C.emberDim },
  tabText: { fontSize: 11, color: C.stone, fontFamily: F.sans },
  tabTextActive: { color: C.ember },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 96 },

  card: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 15,
    marginBottom: 11,
    gap: 4,
  },
  cardLast: { borderColor: C.ember, backgroundColor: 'rgba(227,67,42,0.06)' },
  cardTitle: { fontFamily: F.serif, fontSize: 15, fontWeight: '500', color: C.bone },
  cardRepo: { fontFamily: F.mono, fontSize: 10.5, color: C.stone, marginTop: 2 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  cardActivity: { fontSize: 10.5, color: C.stoneDim, marginTop: 8, fontFamily: F.sans },

  modeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  modeBtn: { paddingVertical: 5, paddingHorizontal: 9 },
  modePriv: { backgroundColor: C.goldDim },
  modePub: { backgroundColor: C.emberDim },
  modeText: { fontSize: 10, fontWeight: '500', color: C.stoneDim, fontFamily: F.sans },
  modeTextPriv: { color: C.gold },
  modeTextPub: { color: C.ember },

  remRepo: { fontFamily: F.mono, fontSize: 12.5, fontWeight: '500', color: C.bone },
  remIdea: { fontSize: 11.5, color: C.stone, marginTop: 4, fontFamily: F.sans, lineHeight: 17 },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  meterSeg: {
    width: 26,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.line,
  },
  meterSegGold: { backgroundColor: C.gold, borderColor: C.gold },
  meterSegEmber: { backgroundColor: C.ember, borderColor: C.ember },
  meterLabel: { fontSize: 10, color: C.stoneDim, marginLeft: 4, fontFamily: F.sans },

  alert: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.emberDim,
    backgroundColor: 'rgba(227,67,42,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  alertText: { fontSize: 11, color: C.stone, lineHeight: 16, fontFamily: F.sans },
  alertStrong: { color: C.ember, fontWeight: '600' },

  remActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  remBtn: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  remBtnText: { fontSize: 11.5, color: C.stone, fontWeight: '500', fontFamily: F.sans },
  remKeep: { borderColor: C.stoneDim },
  remKeepText: { fontSize: 11.5, color: C.bone, fontWeight: '500', fontFamily: F.sans },
  remBury: { borderColor: C.ember, backgroundColor: C.emberDim },
  remBuryText: { fontSize: 11.5, color: C.ember, fontWeight: '500', fontFamily: F.sans },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingVertical: 2, paddingHorizontal: 8 },
  chipMono: { fontSize: 9.5, color: C.stone, fontFamily: F.mono },
  savedMeta: { fontSize: 10, color: C.stoneDim, fontFamily: F.sans, flex: 1 },
  reviveBtn: {
    backgroundColor: C.ember,
    borderRadius: 7,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  reviveBtnText: { color: '#1A0908', fontWeight: '700', fontSize: 12, fontFamily: F.sans },

  timeline: {
    borderLeftWidth: 1,
    borderLeftColor: C.emberDim,
    paddingLeft: 20,
    marginLeft: 6,
    marginTop: 6,
  },
  tlItem: { position: 'relative', paddingBottom: 22 },
  tlDot: {
    position: 'absolute',
    left: -25,
    top: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.bg,
    borderWidth: 2,
    borderColor: C.ember,
  },
  tlDotGlow: {
    borderColor: C.gold,
    shadowColor: C.gold,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  tlTitle: { fontFamily: F.serif, fontSize: 14, fontWeight: '500', color: C.bone },
  tlRepo: { fontFamily: F.mono, fontSize: 10, color: C.stone, marginTop: 2 },
  tlWhat: { fontSize: 12, color: C.stone, marginTop: 6, lineHeight: 18, fontFamily: F.sans },
  tlWho: { fontSize: 11, color: C.gold, marginTop: 6, fontFamily: F.sans },
  tlWhen: { fontSize: 10.5, color: C.stoneDim, marginTop: 3, fontFamily: F.sans },

  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  ctaBtn: {
    borderWidth: 1,
    borderColor: C.ember,
    backgroundColor: C.emberDim,
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaText: { color: C.bone, fontWeight: '600', fontSize: 13.5, fontFamily: F.sans },
});

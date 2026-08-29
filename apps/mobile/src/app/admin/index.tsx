import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateIdea } from '@/components/panel/create-idea';
import { StateChip } from '@/components/state-chip';
import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { LINEAGE, MY_IDEAS, SAVED_IDEAS, type MyIdea } from '@/data/panel';

type Section = 'crear' | 'ideas' | 'saved' | 'external';

const TABS: { key: Section; label: string }[] = [
  { key: 'crear', label: 'Crear una idea' },
  { key: 'ideas', label: 'Mis ideas' },
  { key: 'saved', label: 'Guardadas' },
  { key: 'external', label: 'Contribuciones externas' },
];

const CAPTION: Record<Section, string> = {
  crear: '',
  ideas: 'Todo lo que enterraste o importaste. Los recordatorios se gestionan acá, dentro de cada idea.',
  saved: 'Ideas de otras personas que marcaste con swipe para retomar.',
  external: 'Ideas que enterraste y que otras personas resucitaron o continuaron: tu legado.',
};

export default function AdminPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('ideas');
  const [visibility, setVisibility] = useState<Record<string, 'private' | 'public'>>(
    Object.fromEntries(MY_IDEAS.map((i) => [i.id, i.visibility])),
  );

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/' as Href));
  const openReminder = (id: string) => router.push(`/reminder?id=${id}` as Href);

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
          {!!CAPTION[section] && <Text style={styles.caption}>{CAPTION[section]}</Text>}

          {section === 'crear' && <CreateIdea />}

          {section === 'ideas' &&
            MY_IDEAS.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                visibility={visibility[idea.id]}
                onVisibility={(v) => setVisibility((prev) => ({ ...prev, [idea.id]: v }))}
                onOpenReminder={() => openReminder(idea.id)}
              />
            ))}

          {section === 'saved' &&
            SAVED_IDEAS.map((s) => (
              <View key={s.id} style={styles.card}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardSource}>{s.source}</Text>
                <View style={styles.savedRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{s.origin}</Text>
                  </View>
                  <Text style={styles.savedMeta}>{s.meta}</Text>
                </View>
                <Pressable
                  style={styles.reviveBtn}
                  onPress={() =>
                    Alert.alert(
                      'Reclamar y resucitar',
                      'Heredás la autopsia, los artefactos y el linaje. La persona creadora original recibe una notificación.',
                    )
                  }>
                  <Text style={styles.reviveBtnText}>Reclamar y resucitar  →</Text>
                </Pressable>
              </View>
            ))}

          {section === 'external' && (
            <View style={styles.timeline}>
              {LINEAGE.map((l) => (
                <View key={l.id} style={styles.tlItem}>
                  <View style={[styles.tlDot, l.glow && styles.tlDotGlow]} />
                  <Text style={styles.tlTitle}>{l.title}</Text>
                  {!!l.source && <Text style={styles.tlSource}>{l.source}</Text>}
                  <Text style={styles.tlWhat}>{l.what}</Text>
                  <Text style={styles.tlWho}>{l.who}</Text>
                  <Text style={styles.tlWhen}>{l.when}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* sticky CTA — la sección "Crear una idea" trae su propio botón */}
        {section !== 'crear' && (
          <View style={[styles.sticky, { paddingBottom: 14 + insets.bottom }]}>
            <Pressable style={styles.ctaBtn} onPress={() => setSection('crear')}>
              <Text style={styles.ctaText}>＋  Crear una idea</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Idea card — incluye la gestión del recordatorio cuando hay uno     */
/* ------------------------------------------------------------------ */

function IdeaCard({
  idea,
  visibility,
  onVisibility,
  onOpenReminder,
}: {
  idea: MyIdea;
  visibility: 'private' | 'public';
  onVisibility: (v: 'private' | 'public') => void;
  onOpenReminder: () => void;
}) {
  const rem = idea.reminder;
  const isLast = rem?.step === 3;

  return (
    <View style={[styles.card, isLast && styles.cardLast]}>
      <Text style={styles.cardTitle}>{idea.title}</Text>
      {!!idea.source && <Text style={styles.cardSource}>{idea.source}</Text>}

      <View style={styles.cardRow}>
        <StateChip state={idea.state} label={idea.stateLabel} />
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => onVisibility('private')}
            style={[styles.modeBtn, visibility === 'private' && styles.modePriv]}>
            <Text style={[styles.modeText, visibility === 'private' && styles.modeTextPriv]}>
              Priv
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onVisibility('public')}
            style={[styles.modeBtn, visibility === 'public' && styles.modePub]}>
            <Text style={[styles.modeText, visibility === 'public' && styles.modeTextPub]}>
              Público
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.cardActivity}>{idea.activity}</Text>

      {rem && (
        <View style={styles.remBlock}>
          <View style={styles.meter}>
            {[1, 2, 3].map((n) => (
              <View
                key={n}
                style={[
                  styles.meterSeg,
                  n <= rem.step && (isLast ? styles.meterSegEmber : styles.meterSegGold),
                ]}
              />
            ))}
            <Text style={styles.meterLabel}>{rem.step} / 3</Text>
          </View>

          <Text style={styles.remWhy}>{rem.inactiveLabel}.</Text>

          {isLast && (
            <View style={styles.alert}>
              <Text style={styles.alertText}>
                <Text style={styles.alertStrong}>Último aviso. </Text>
                Enterrar genera un borrador de autopsia automático que revisás antes de publicar.
              </Text>
            </View>
          )}

          <View style={styles.remActions}>
            <Pressable
              style={[styles.remBtn, styles.remKeep]}
              onPress={() =>
                Alert.alert(
                  'Sigo con esto',
                  `Contador reiniciado. Próximo aviso en ${rem.keepEveryLabel}.`,
                )
              }>
              <Text style={styles.remKeepText}>Sigo con esto</Text>
            </Pressable>
            {!isLast && (
              <Pressable
                style={styles.remBtn}
                onPress={() =>
                  Alert.alert('Pospuesto', 'Se reprograma pronto sin resetear el contador.')
                }>
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
                {isLast ? 'Enterrar y generar autopsia' : 'Enterrar ahora'}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onOpenReminder} hitSlop={6}>
            <Text style={styles.remOpen}>Abrir recordatorio completo  →</Text>
          </Pressable>
        </View>
      )}
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
  caption: { fontSize: 11, lineHeight: 16, color: C.stoneDim, fontFamily: F.sans, marginBottom: 12 },

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
  cardSource: { fontFamily: F.mono, fontSize: 10.5, color: C.stone, marginTop: 2 },
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

  /* bloque de recordatorio dentro de la tarjeta de idea */
  remBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
    gap: 4,
  },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
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
  remWhy: { fontSize: 11, color: C.stone, fontFamily: F.sans, marginTop: 8 },

  alert: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.emberDim,
    backgroundColor: 'rgba(227,67,42,0.08)',
    borderRadius: 8,
    padding: 10,
  },
  alertText: { fontSize: 11, color: C.stone, lineHeight: 16, fontFamily: F.sans },
  alertStrong: { color: C.ember, fontWeight: '600' },

  remActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
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
  remOpen: { fontSize: 11, color: C.gold, fontFamily: F.sans, fontWeight: '500', marginTop: 12 },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  chipText: { fontSize: 9.5, color: C.stone, fontFamily: F.sans },
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
  tlSource: { fontFamily: F.mono, fontSize: 10, color: C.stone, marginTop: 2 },
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

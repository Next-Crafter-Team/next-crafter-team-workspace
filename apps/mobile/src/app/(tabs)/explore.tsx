import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeDeck, type SwipeDeckHandle, type SwipeDir } from '@/components/explore/swipe-deck';
import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import { BottomTabInset } from '@/constants/theme';
import { GRAVES, type Grave } from '@/data/graves';

const GESTURES: Record<
  SwipeDir,
  { glyph: string; caption: string; toast: string; color: string; fill: string }
> = {
  left: { glyph: '✕', caption: 'Descansá\nen paz', toast: 'Descansá en paz', color: C.stone, fill: 'transparent' },
  up: { glyph: '↑', caption: 'Yo también\nlo intenté', toast: 'Reacción enviada', color: C.gold, fill: C.goldDim },
  right: { glyph: '♻', caption: 'Me interesa\nretomarla', toast: 'Guardada para reclamar', color: C.ember, fill: C.emberDim },
};

export default function ExploreScreen() {
  const deckRef = useRef<SwipeDeckHandle>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [resetKey, setResetKey] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [saved, setSaved] = useState(0);
  const [passed, setPassed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [sheetGrave, setSheetGrave] = useState<Grave | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);

  const handleResolve = useCallback(
    (_grave: Grave, dir: SwipeDir) => {
      if (dir === 'right') setSaved((n) => n + 1);
      if (dir === 'left') setPassed((n) => n + 1);
      const g = GESTURES[dir];
      showToast(dir === 'right' ? `${g.toast} · ${saved + 1}` : g.toast);
    },
    [saved, showToast],
  );

  const resetDeck = useCallback(() => {
    setResetKey((k) => k + 1);
    setSaved(0);
    setPassed(0);
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.h1}>Explorar el cementerio</Text>
          <View style={styles.countPill}>
            <Text style={styles.countNum}>{remaining}</Text>
            <Text style={styles.countLabel}> por ver</Text>
          </View>
        </View>

        <View style={styles.deckWrap}>
          <SwipeDeck
            key={resetKey}
            ref={deckRef}
            data={GRAVES}
            onResolve={handleResolve}
            onRemaining={setRemaining}
            onTapCard={setSheetGrave}
            renderEmpty={() => (
              <View style={styles.empty}>
                <Text style={styles.emptyUrn}>&#9905;</Text>
                <Text style={styles.emptyTitle}>
                  Recorriste todo el cementerio{'\n'}por esta sesión
                </Text>
                <Text style={styles.emptyText}>
                  Guardaste {saved} {saved === 1 ? 'idea' : 'ideas'} para reclamar y despediste{' '}
                  {passed}.
                </Text>
                <View style={styles.emptyActions}>
                  <Pressable
                    style={[styles.eBtn, styles.eBtnPrimary]}
                    onPress={() => showToast('Iría a la pantalla Guardadas')}>
                    <Text style={styles.eBtnPrimaryText}>Ver mis guardadas ({saved})</Text>
                  </Pressable>
                  <Pressable style={[styles.eBtn, styles.eBtnGhost]} onPress={resetDeck}>
                    <Text style={styles.eBtnGhostText}>Reiniciar el mazo</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.actionBar}>
          {(['left', 'up', 'right'] as SwipeDir[]).map((dir) => {
            const g = GESTURES[dir];
            return (
              <View key={dir} style={styles.actWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={g.toast}
                  onPress={() => deckRef.current?.swipe(dir)}
                  style={({ pressed }) => [
                    styles.act,
                    {
                      borderColor: pressed ? g.color : C.line,
                      backgroundColor: pressed ? g.fill : C.bgCard,
                    },
                  ]}>
                  <Text style={[styles.actGlyph, { color: g.color }]}>{g.glyph}</Text>
                </Pressable>
                <Text style={styles.actCaption}>{g.caption}</Text>
              </View>
            );
          })}
        </View>

        <Pressable
          style={styles.autopsyBtn}
          onPress={() => {
            const top = GRAVES[GRAVES.length - remaining];
            if (top) setSheetGrave(top);
          }}>
          <Text style={styles.autopsyBtnText}>Tocá la lápida para leer la autopsia  &#8250;</Text>
        </Pressable>
      </SafeAreaView>

      {toast && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(200)}
          pointerEvents="none"
          style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      <Modal
        visible={!!sheetGrave}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetGrave(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetGrave(null)} />
        <View style={styles.sheet}>
          <View style={styles.grip} />
          {sheetGrave && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sEyebrow}>AUTOPSIA · VISTA RÁPIDA</Text>
              <Text style={styles.sTitle}>{sheetGrave.title}</Text>
              {sheetGrave.repo ? (
                <Text style={styles.sRepo}>{sheetGrave.repo}</Text>
              ) : null}

              <View style={styles.sMetrics}>
                <View style={styles.sMetric}>
                  <Text style={styles.sMetricLabel}>ENTERRADA</Text>
                  <Text style={styles.sMetricValue}>{sheetGrave.buried}</Text>
                </View>
                <View style={[styles.sMetric, { borderRightWidth: 0 }]}>
                  <Text style={styles.sMetricLabel}>REACCIONES</Text>
                  <Text style={[styles.sMetricValue, { color: C.ember }]}>{sheetGrave.reactions}</Text>
                </View>
              </View>

              <Text style={styles.sSecLabel}>POR QUÉ MURIÓ</Text>
              <Text style={styles.sSecBody}>{sheetGrave.why}</Text>

              <Text style={styles.sSecLabel}>QUÉ SE APRENDIÓ</Text>
              <Text style={styles.sSecBody}>{sheetGrave.learned}</Text>

              <View style={styles.sCtaRow}>
                <Pressable
                  style={styles.btnRevive}
                  onPress={() => {
                    setSheetGrave(null);
                    showToast('Flujo de reclamar (requiere sesión)');
                  }}>
                  <Text style={styles.btnReviveText}>Reclamar y resucitar  &#8594;</Text>
                </Pressable>
                <Pressable
                  style={styles.btnFull}
                  onPress={() => {
                    setSheetGrave(null);
                    showToast('Abriría la Autopsia pública');
                  }}>
                  <Text style={styles.btnFullText}>Autopsia completa</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1, paddingBottom: BottomTabInset },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  h1: { flex: 1, fontFamily: F.serif, fontSize: 20, fontWeight: '500', color: C.bone },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 11,
    backgroundColor: C.bgCard,
  },
  countNum: { fontSize: 12, fontWeight: '700', color: C.ember, fontFamily: F.sans },
  countLabel: { fontSize: 11, color: C.stone, fontFamily: F.sans },

  deckWrap: { flex: 1, marginHorizontal: 18, marginTop: 10, marginBottom: 10 },

  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 22,
    paddingHorizontal: 18,
  },
  actWrap: { alignItems: 'center', gap: 6 },
  act: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actGlyph: { fontSize: 22, fontWeight: '600' },
  actCaption: {
    fontSize: 9.5,
    lineHeight: 12,
    color: C.stoneDim,
    textAlign: 'center',
    fontFamily: F.sans,
  },

  autopsyBtn: {
    marginHorizontal: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  autopsyBtnText: { fontSize: 12, color: C.stone, fontFamily: F.sans, fontWeight: '500' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyUrn: { fontSize: 34 },
  emptyTitle: {
    fontFamily: F.serif,
    fontSize: 20,
    fontWeight: '500',
    color: C.bone,
    textAlign: 'center',
    lineHeight: 25,
  },
  emptyText: {
    fontSize: 13,
    color: C.stone,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: F.sans,
    maxWidth: 280,
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 6,
  },
  eBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  eBtnPrimary: { backgroundColor: C.emberDim, borderWidth: 1, borderColor: C.ember },
  eBtnPrimaryText: { color: C.bone, fontSize: 12, fontWeight: '600', fontFamily: F.sans },
  eBtnGhost: { borderWidth: 1, borderColor: C.line },
  eBtnGhostText: { color: C.stone, fontSize: 12, fontWeight: '500', fontFamily: F.sans },

  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: BottomTabInset + 120,
    backgroundColor: C.bgInput,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  toastText: { color: C.bone, fontSize: 12, fontFamily: F.sans },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(6,3,3,0.6)' },
  sheet: {
    backgroundColor: C.bgRaised,
    borderTopWidth: 1,
    borderTopColor: C.line,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '86%',
  },
  grip: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.stoneDim,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sEyebrow: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: C.ember,
    fontFamily: F.sans,
    fontWeight: '600',
    marginBottom: 6,
  },
  sTitle: {
    fontFamily: F.serif,
    fontSize: 20,
    fontWeight: '500',
    color: C.bone,
    lineHeight: 25,
    marginBottom: 6,
  },
  sRepo: { fontFamily: F.mono, fontSize: 11.5, color: C.stone, marginBottom: 16 },
  sMetrics: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sMetric: {
    flex: 1,
    backgroundColor: C.bgCard,
    padding: 11,
    borderRightWidth: 1,
    borderRightColor: C.line,
  },
  sMetricLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    color: C.stoneDim,
    fontFamily: F.sans,
    marginBottom: 4,
  },
  sMetricValue: { fontFamily: F.serif, fontSize: 15, color: C.bone },
  sSecLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: C.gold,
    fontFamily: F.sans,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 4,
  },
  sSecBody: { fontSize: 13, lineHeight: 21, color: C.bodyText, fontFamily: F.sans, marginBottom: 14 },
  sCtaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnRevive: {
    flex: 1,
    backgroundColor: C.ember,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnReviveText: { color: '#1A0908', fontWeight: '700', fontSize: 13, fontFamily: F.sans },
  btnFull: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  btnFullText: { color: C.stone, fontSize: 12, fontWeight: '500', fontFamily: F.sans },
});

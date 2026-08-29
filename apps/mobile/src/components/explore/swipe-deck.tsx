import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GraveCard } from './grave-card';

import { Cementerio as C, CementerioFonts as F } from '@/constants/cementerio';
import type { Grave } from '@/data/graves';

const { width: W, height: H } = Dimensions.get('window');
const SWIPE_X = W * 0.26;
const SWIPE_Y = H * 0.14;
const POS_SPRING = { damping: 18, stiffness: 170, mass: 0.7 };

export type SwipeDir = 'left' | 'right' | 'up';
export type SwipeDeckHandle = { swipe: (dir: SwipeDir) => void };

type DeckProps = {
  data: Grave[];
  onResolve?: (grave: Grave, dir: SwipeDir) => void;
  onTapCard?: (grave: Grave) => void;
  onRemaining?: (count: number) => void;
  renderEmpty?: () => ReactNode;
};

/* --------------------------------------------------------------------------- */
/*  Carta individual: dueña de su propio gesto y animación de salida          */
/* --------------------------------------------------------------------------- */

type CardProps = {
  grave: Grave;
  position: number; // 0 = arriba, 1, 2 = detrás
  isTop: boolean;
  onSwiped: (id: string, dir: SwipeDir) => void;
  onTap: (grave: Grave) => void;
  registerFling: (fn: (dir: SwipeDir) => void) => void;
};

function DeckCard({ grave, position, isTop, onSwiped, onTap, registerFling }: CardProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const p = useDerivedValue(() => withSpring(position, POS_SPRING), [position]);

  const flingOff = useCallback(
    (dir: SwipeDir) => {
      const toX = dir === 'right' ? W * 1.5 : dir === 'left' ? -W * 1.5 : tx.value;
      const toY = dir === 'up' ? -H * 1.4 : ty.value + 90;
      tx.value = withTiming(toX, { duration: 320 });
      ty.value = withTiming(toY, { duration: 320 }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(onSwiped, grave.id, dir);
      });
    },
    [grave.id, onSwiped, tx, ty],
  );

  useEffect(() => {
    if (isTop) registerFling(flingOff);
  }, [isTop, flingOff, registerFling]);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      let dir: SwipeDir | null = null;
      if (e.translationX > SWIPE_X || e.velocityX > 850) dir = 'right';
      else if (e.translationX < -SWIPE_X || e.velocityX < -850) dir = 'left';
      else if (e.translationY < -SWIPE_Y || e.velocityY < -950) dir = 'up';

      if (dir) {
        const toX = dir === 'right' ? W * 1.5 : dir === 'left' ? -W * 1.5 : tx.value;
        const toY = dir === 'up' ? -H * 1.4 : ty.value + 90;
        tx.value = withTiming(toX, { duration: 300 });
        ty.value = withTiming(toY, { duration: 300 }, (finished) => {
          if (finished) scheduleOnRN(onSwiped, grave.id, dir as SwipeDir);
        });
      } else {
        tx.value = withSpring(0, { damping: 20, stiffness: 220 });
        ty.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const tap = Gesture.Tap()
    .enabled(isTop)
    .maxDistance(10)
    .onEnd((_e, success) => {
      'worklet';
      if (success) scheduleOnRN(onTap, grave);
    });

  const cardStyle = useAnimatedStyle(() => {
    const depth = p.value;
    const rot = interpolate(tx.value, [-W, W], [-9, 9], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value + depth * 16 },
        { scale: 1 - depth * 0.05 },
        { rotate: `${rot}deg` },
      ],
      opacity: interpolate(depth, [0, 2, 2.7], [1, 1, 0], Extrapolation.CLAMP),
    };
  });

  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1, 2], [0, 0.32, 0.5], Extrapolation.CLAMP),
  }));

  const overlayRight = useAnimatedStyle(() => ({
    opacity:
      Math.abs(tx.value) > Math.abs(ty.value)
        ? interpolate(tx.value, [20, SWIPE_X], [0, 1], Extrapolation.CLAMP)
        : 0,
  }));
  const overlayLeft = useAnimatedStyle(() => ({
    opacity:
      Math.abs(tx.value) > Math.abs(ty.value)
        ? interpolate(tx.value, [-SWIPE_X, -20], [1, 0], Extrapolation.CLAMP)
        : 0,
  }));
  const overlayUp = useAnimatedStyle(() => ({
    opacity:
      Math.abs(ty.value) > Math.abs(tx.value)
        ? interpolate(ty.value, [-SWIPE_Y, -20], [1, 0], Extrapolation.CLAMP)
        : 0,
  }));

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View
        style={[styles.card, cardStyle, { zIndex: 10 - position }]}
        pointerEvents={isTop ? 'auto' : 'none'}>
        <GraveCard grave={grave} />

        <Animated.View pointerEvents="none" style={[styles.dim, dimStyle]} />

        <Animated.View pointerEvents="none" style={[styles.overlay, styles.ovRight, overlayRight]}>
          <Text style={[styles.ovLabel, { color: C.ember, borderColor: C.ember }]}>Retomar</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.overlay, styles.ovLeft, overlayLeft]}>
          <Text style={[styles.ovLabel, { color: C.stone, borderColor: C.stone }]}>
            Descansá en paz
          </Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.overlay, styles.ovUp, overlayUp]}>
          <Text style={[styles.ovLabel, { color: C.gold, borderColor: C.gold }]}>Yo también</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/* --------------------------------------------------------------------------- */
/*  Deck: mantiene el índice y renderiza hasta 3 cartas                        */
/* --------------------------------------------------------------------------- */

export const SwipeDeck = forwardRef<SwipeDeckHandle, DeckProps>(function SwipeDeck(
  { data, onResolve, onTapCard, onRemaining, renderEmpty },
  ref,
) {
  const [index, setIndex] = useState(0);
  const dataRef = useRef(data);
  const onResolveRef = useRef(onResolve);
  const onTapRef = useRef(onTapCard);
  const flingRef = useRef<((dir: SwipeDir) => void) | null>(null);

  dataRef.current = data;
  onResolveRef.current = onResolve;
  onTapRef.current = onTapCard;

  useEffect(() => {
    onRemaining?.(Math.max(0, data.length - index));
  }, [index, data.length, onRemaining]);

  const handleSwiped = useCallback((id: string, dir: SwipeDir) => {
    const grave = dataRef.current.find((g) => g.id === id);
    if (grave) onResolveRef.current?.(grave, dir);
    setIndex((i) => i + 1);
  }, []);

  const handleTap = useCallback((grave: Grave) => {
    onTapRef.current?.(grave);
  }, []);

  const registerFling = useCallback((fn: (dir: SwipeDir) => void) => {
    flingRef.current = fn;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      swipe: (dir: SwipeDir) => flingRef.current?.(dir),
    }),
    [],
  );

  const done = index >= data.length;
  const visible = data.slice(index, index + 3);

  return (
    <View style={styles.deckArea}>
      {done
        ? renderEmpty?.()
        : visible
            .map((grave, i) => (
              <DeckCard
                key={grave.id}
                grave={grave}
                position={i}
                isTop={i === 0}
                onSwiped={handleSwiped}
                onTap={handleTap}
                registerFling={registerFling}
              />
            ))
            .reverse()}
    </View>
  );
});

const styles = StyleSheet.create({
  deckArea: {
    flex: 1,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    padding: 28,
  },
  ovRight: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  ovLeft: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  ovUp: { justifyContent: 'flex-end' },
  ovLabel: {
    fontFamily: F.serif,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
});

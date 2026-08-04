import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tripTotal, usd } from '../src/format';
import { gradient } from '../src/gradients';
import { useStore } from '../src/store';
import { useTheme } from '../src/theme';

export default function TripsScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trips, getExpenses } = useStore();

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, gap: 18 }}
    >
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <LinearGradient
            colors={[colors.teal, colors.saffron]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mark}
          >
            <Text style={{ color: '#fff', fontSize: 15 }}>✦</Text>
          </LinearGradient>
          <Text style={[styles.brand, { color: colors.ink, fontFamily: fonts.display }]}>TravelPal</Text>
        </View>
        <Text style={[styles.kicker, { color: colors.inkSoft, fontFamily: fonts.mono }]}>YOUR TRIPS</Text>
      </View>

      {trips.map((trip) => {
        const expenses = getExpenses(trip.id);
        const cover = gradient(trip.coverGradient);
        return (
          <Pressable
            key={trip.id}
            onPress={() => router.push(`/trip/${trip.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.card,
              { borderColor: colors.line, backgroundColor: colors.surface },
              pressed && { transform: [{ translateY: -2 }], borderColor: colors.saffron },
            ]}
          >
            <View style={styles.cover}>
              <LinearGradient
                colors={cover as unknown as [string, string, ...string[]]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.coverBody}>
                <Text style={[styles.coverTitle, { fontFamily: fonts.display }]}>{trip.title}</Text>
                <Text style={[styles.coverSub, { fontFamily: fonts.mono }]}>{trip.subtitle}</Text>
              </View>
            </View>

            <View style={styles.meta}>
              <Stat n={String(trip.days.length)} l="days" colors={colors} fonts={fonts} />
              <Stat n={usd(tripTotal(expenses))} l="spend" colors={colors} fonts={fonts} />
              <Stat n={String(trip.photosKept)} l="photos" colors={colors} fonts={fonts} />
              <View style={{ flex: 1 }} />
              <Ionicons name="chevron-forward" size={20} color={colors.inkSoft} />
            </View>
          </Pressable>
        );
      })}

      <View style={[styles.addHint, { borderColor: colors.line }]}>
        <Ionicons name="add" size={18} color={colors.inkSoft} />
        <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12 }}>
          New trip — coming soon
        </Text>
      </View>
    </ScrollView>
  );
}

function Stat({
  n,
  l,
  colors,
  fonts,
}: {
  n: string;
  l: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
}) {
  return (
    <View>
      <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 20, fontWeight: '600' }}>{n}</Text>
      <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
        {l}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 24, fontWeight: '600' },
  kicker: { fontSize: 11, letterSpacing: 2 },
  card: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  cover: { height: 210, justifyContent: 'flex-end' },
  coverBody: { padding: 18, gap: 6 },
  coverTitle: { color: '#fff', fontSize: 30, fontWeight: '600' },
  coverSub: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 22, padding: 16 },
  addHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
  },
});

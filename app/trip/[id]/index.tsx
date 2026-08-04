import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayCard } from '../../../src/components/DayCard';
import { Wallet } from '../../../src/components/Wallet';
import { daySpend, tripTotal, usd } from '../../../src/format';
import { gradient } from '../../../src/gradients';
import { useStore } from '../../../src/store';
import { useTheme } from '../../../src/theme';

export default function TripSummaryScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTrip, getExpenses } = useStore();

  const trip = getTrip(id);
  if (!trip) {
    return (
      <View style={[styles.center, { backgroundColor: colors.paper }]}>
        <Text style={{ color: colors.ink }}>Trip not found.</Text>
      </View>
    );
  }

  const expenses = getExpenses(trip.id);
  const cover = gradient(trip.coverGradient);
  const placesCount = trip.days.reduce((n, d) => n + d.places.length, 0);
  const scanned = expenses.filter((e) => e.source === 'scan').length;
  const emailed = expenses.filter((e) => e.source === 'email').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Cover */}
        <View style={styles.cover}>
          <LinearGradient
            colors={cover as unknown as [string, string, ...string[]]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(10,14,15,0.05)', 'rgba(10,14,15,0.72)']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={[styles.backBtn, { top: insets.top + 8 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={[styles.coverBody, { paddingTop: insets.top + 60 }]}>
            <Text style={[styles.kicker, { fontFamily: fonts.mono }]}>✦ TRAVELPAL · TRIP RECAP</Text>
            <Text style={[styles.title, { fontFamily: fonts.display }]}>{trip.title}</Text>
            <Text style={[styles.sub, { fontFamily: fonts.display }]}>{trip.subtitle}</Text>
            <Text style={[styles.route, { fontFamily: fonts.mono, borderTopColor: 'rgba(255,255,255,0.22)' }]}>
              {trip.route}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.stats, { borderColor: colors.line }]}>
          <StatCell n={String(trip.days.length)} l="Days" colors={colors} fonts={fonts} first />
          <StatCell n={String(placesCount)} l="Places" colors={colors} fonts={fonts} />
          <StatCell n={usd(tripTotal(expenses))} l="Spend" colors={colors} fonts={fonts} />
          <StatCell n={String(trip.photosKept)} l="Photos" colors={colors} fonts={fonts} />
        </View>

        {/* Day by day */}
        <View style={styles.section}>
          <SectionHead idx="01" title="The trip, day by day" meta="tap a day to open its full page" colors={colors} fonts={fonts} />
          <View style={{ gap: 16 }}>
            {trip.days.map((day) => (
              <DayCard
                key={day.index}
                day={day}
                spend={daySpend(expenses, day.index)}
                onPress={() => router.push(`/trip/${trip.id}/day/${day.index}`)}
              />
            ))}
          </View>
        </View>

        {/* Wallet */}
        <View style={[styles.section, { borderTopColor: colors.line, borderTopWidth: 1 }]}>
          <SectionHead idx="02" title="Trip wallet" meta="every receipt, auto-added" colors={colors} fonts={fonts} />
          <Wallet
            expenses={expenses}
            days={trip.days}
            receiptsScanned={scanned}
            emailReceipts={emailed}
            onScan={() => router.push(`/trip/${trip.id}/receipt`)}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11 }}>
            ✦ TravelPal · shareable trip recap
          </Text>
        </View>
      </ScrollView>

      {/* Receipt FAB */}
      <Pressable
        onPress={() => router.push(`/trip/${trip.id}/receipt`)}
        accessibilityLabel="Scan a receipt"
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20 }, pressed && { opacity: 0.9 }]}
      >
        <LinearGradient
          colors={[colors.teal, colors.saffron]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="camera-outline" size={18} color="#fff" />
        <Text style={styles.fabText}>Receipt</Text>
      </Pressable>
    </View>
  );
}

function StatCell({
  n,
  l,
  colors,
  fonts,
  first,
}: {
  n: string;
  l: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
  first?: boolean;
}) {
  return (
    <View style={[styles.statCell, { borderColor: colors.line }, first && { borderLeftWidth: 0 }]}>
      <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 26, fontWeight: '600' }}>{n}</Text>
      <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginTop: 5 }}>
        {l}
      </Text>
    </View>
  );
}

function SectionHead({
  idx,
  title,
  meta,
  colors,
  fonts,
}: {
  idx: string;
  title: string;
  meta?: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
}) {
  return (
    <View style={styles.secHead}>
      <Text style={{ color: colors.saffron, fontFamily: fonts.mono, fontSize: 12 }}>{idx}</Text>
      <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 23, fontWeight: '600' }}>{title}</Text>
      {meta ? (
        <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11, marginLeft: 'auto' }} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { minHeight: 380, justifyContent: 'flex-end' },
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBody: { padding: 24, gap: 8 },
  kicker: { color: 'rgba(255,255,255,0.92)', fontSize: 11, letterSpacing: 2 },
  title: { color: '#fff', fontSize: 46, fontWeight: '600', lineHeight: 48 },
  sub: { color: 'rgba(255,255,255,0.95)', fontSize: 17, fontStyle: 'italic', maxWidth: '90%' },
  route: { color: '#fff', fontSize: 12, paddingTop: 14, marginTop: 8, borderTopWidth: 1 },
  stats: { flexDirection: 'row', borderBottomWidth: 1 },
  statCell: { flex: 1, paddingVertical: 18, paddingHorizontal: 14, borderLeftWidth: 1 },
  section: { padding: 22, gap: 20 },
  secHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  footer: { padding: 22, alignItems: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 19,
    paddingVertical: 14,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

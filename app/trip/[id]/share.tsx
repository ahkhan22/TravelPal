import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportRecapPdf } from '../../../src/exportRecap';
import { useStore } from '../../../src/store';
import { useTheme } from '../../../src/theme';

export default function ShareScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTrip, getExpenses, getPhotos, getMeals, getPlaces } = useStore();
  const trip = getTrip(id);

  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeSpend, setIncludeSpend] = useState(true);
  const [busy, setBusy] = useState(false);

  if (!trip) {
    return (
      <View style={[styles.center, { backgroundColor: colors.paper }]}>
        <Text style={{ color: colors.ink }}>Trip not found.</Text>
      </View>
    );
  }

  async function create() {
    if (busy || !trip) return;
    setBusy(true);
    try {
      const ateByDay: Record<number, string[]> = {};
      const sawByDay: Record<number, string[]> = {};
      trip.days.forEach((d) => {
        ateByDay[d.index] = getMeals(trip.id, d.index).map((m) => m.name);
        sawByDay[d.index] = getPlaces(trip.id, d.index).map((p) => p.name);
      });
      await exportRecapPdf(trip, getExpenses(trip.id), {
        photos: getPhotos(trip.id),
        includePhotos,
        includeSpend,
        ateByDay,
        sawByDay,
      });
      router.back();
    } catch {
      Alert.alert('Export failed', 'Could not create the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.head, { paddingTop: insets.top + 12, borderColor: colors.line }]}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>Share recap</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={[styles.x, { borderColor: colors.line }]}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <View style={{ padding: 20, gap: 6 }}>
        <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Include in the PDF
        </Text>

        <ToggleRow
          title="Photos"
          subtitle="Your featured photos on the cover and day cards"
          value={includePhotos}
          onValueChange={setIncludePhotos}
          colors={colors}
          fonts={fonts}
        />
        <ToggleRow
          title="Spending"
          subtitle="Per-day totals and the trip wallet breakdown"
          value={includeSpend}
          onValueChange={setIncludeSpend}
          colors={colors}
          fonts={fonts}
        />

        <Pressable onPress={create} disabled={busy} style={[styles.btn, { backgroundColor: colors.teal }, busy && { opacity: 0.7 }]}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="share-outline" size={18} color="#fff" />}
          <Text style={styles.btnText}>{busy ? 'Building PDF…' : 'Create & share PDF'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  colors,
  fonts,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
}) {
  return (
    <View style={[styles.row, { borderColor: colors.line }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: 15, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11, marginTop: 3 }}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.teal, false: colors.line }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  x: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 12, padding: 16 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 15, borderRadius: 12, marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

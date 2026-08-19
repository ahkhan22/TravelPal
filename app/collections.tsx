import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhotoTile } from '../src/components/PhotoTile';
import { useStore } from '../src/store';
import { useTheme } from '../src/theme';

type Filter = { kind: 'favorites' } | { kind: 'all' } | { kind: 'label'; value: string };

// Cross-trip photo browsing. Pick a tag (or Favorites) and every matching photo
// from any trip is pulled together — the "show me my Outfit photos from every
// trip" idea.
export default function CollectionsScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getAllPhotos, getTrip } = useStore();

  const all = getAllPhotos();
  const favorites = all.filter((p) => p.favorite);

  const labelCounts = new Map<string, number>();
  all.forEach((p) => (p.labels ?? []).forEach((l) => labelCounts.set(l, (labelCounts.get(l) ?? 0) + 1)));
  const labels = Array.from(labelCounts.keys()).sort();

  const [filter, setFilter] = useState<Filter>(favorites.length ? { kind: 'favorites' } : { kind: 'all' });

  const photos =
    filter.kind === 'favorites'
      ? favorites
      : filter.kind === 'all'
        ? all
        : all.filter((p) => (p.labels ?? []).some((x) => x.toLowerCase() === filter.value.toLowerCase()));

  const chip = (label: string, active: boolean, onPress: () => void, accent = colors.teal) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.chip, { borderColor: colors.line }, active && { backgroundColor: accent, borderColor: accent }]}
    >
      <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.bar, { paddingTop: insets.top + 10, borderColor: colors.line }]}>
        <Text
          onPress={() => router.back()}
          style={[styles.back, { color: colors.ink, borderColor: colors.line, fontFamily: fonts.mono }]}
        >
          ← Trips
        </Text>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 17 }}>Browse by tag</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.filters}>
          {chip(`★ Favorites (${favorites.length})`, filter.kind === 'favorites', () => setFilter({ kind: 'favorites' }), colors.brick)}
          {chip(`All (${all.length})`, filter.kind === 'all', () => setFilter({ kind: 'all' }), colors.inkSoft)}
          {labels.map((l) =>
            chip(
              `${l} (${labelCounts.get(l)})`,
              filter.kind === 'label' && filter.value === l,
              () => setFilter({ kind: 'label', value: l }),
              colors.saffron,
            ),
          )}
        </View>

        {labels.length === 0 && (
          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12, marginTop: 8 }}>
            Add tags to your photos (open a photo → Tags) to build collections like “Outfit” or “Sunset”.
          </Text>
        )}

        <View style={styles.grid}>
          {photos.map((p) => {
            const t = getTrip(p.tripId);
            return (
              <Pressable key={p.id} onPress={() => router.push(`/trip/${p.tripId}/photo/${p.id}`)} style={styles.tile}>
                <PhotoTile uri={p.uri} caption={p.caption} tag={t?.destination} aspectRatio={1} captionSize={11} />
              </Pressable>
            );
          })}
        </View>

        {photos.length === 0 && labels.length > 0 && (
          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12, marginTop: 16 }}>
            No photos in this collection yet.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 13, borderBottomWidth: 1 },
  back: { fontSize: 12, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, overflow: 'hidden' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { flexBasis: '31%', flexGrow: 1 },
});

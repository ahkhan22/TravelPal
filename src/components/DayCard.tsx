import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usd } from '../format';
import { useTheme } from '../theme';
import type { Day, Photo } from '../types';
import { PhotoTile } from './PhotoTile';

// One day, condensed for the shareable digest: hero photo(s), what I ate, what
// I saw, and the day's on-the-ground spend. Tapping opens the full day page.
// If the user has added their own photos to the day, those (favorites first)
// become the heroes; otherwise the sample gradient heroes are shown.

interface Props {
  day: Day;
  spend: number;
  photos?: Photo[];
  mealNames?: string[];
  placeNames?: string[];
  onPress: () => void;
}

export function DayCard({ day, spend, photos = [], mealNames, placeNames, onPress }: Props) {
  const { colors, fonts } = useTheme();
  const featured = photos.filter((p) => p.featured);
  const favorites = photos.filter((p) => p.favorite);
  const chosen = (featured.length ? featured : favorites).slice(0, 2);
  const heroes = chosen.length
    ? chosen.map((p) => ({ uri: p.uri, caption: p.caption, favorite: p.favorite, gradient: 0 }))
    : day.heroes.slice(0, 2).map((h) => ({ uri: undefined as string | undefined, ...h }));
  const ate = (mealNames ?? day.meals.map((m) => m.name)).join(', ');
  const saw = (placeNames ?? day.places.map((p) => p.name)).join(', ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open Day ${day.index}, ${day.title}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line },
        pressed && { borderColor: colors.saffron, transform: [{ translateY: -1 }] },
      ]}
    >
      <View style={styles.heroes}>
        {heroes.map((h, i) => (
          <PhotoTile
            key={i}
            uri={h.uri}
            gradientIndex={h.gradient}
            caption={h.caption}
            favorite={h.favorite}
            tag={`Day ${day.index}`}
            aspectRatio={heroes.length > 1 ? 16 / 10 : 4 / 3}
            captionSize={11.5}
            style={styles.hero}
          />
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={[styles.dayLabel, { color: colors.saffron, fontFamily: fonts.mono }]}>
            DAY {day.index}
          </Text>
          <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.display }]}>
            {day.title}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
          {day.dateLabel} · {usd(spend)} spent
        </Text>

        <Row label="ATE" colors={colors} fonts={fonts}>
          {ate || '—'}
        </Row>
        <Row label="SAW" colors={colors} fonts={fonts}>
          {saw || '—'}
        </Row>

        <Text style={[styles.open, { color: colors.teal, fontFamily: fonts.mono }]}>
          Open full day →
        </Text>
      </View>
    </Pressable>
  );
}

function Row({
  label,
  children,
  colors,
  fonts,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.inkSoft, borderColor: colors.line, fontFamily: fonts.mono }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: colors.ink }]} numberOfLines={2}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 9,
    padding: 12,
    gap: 12,
  },
  heroes: { flexDirection: 'row', gap: 8 },
  hero: { flex: 1 },
  body: { gap: 10 },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  dayLabel: { fontSize: 11, letterSpacing: 1.4 },
  title: { fontSize: 20, fontWeight: '600' },
  date: { fontSize: 11.5 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowLabel: {
    fontSize: 9.5,
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  rowValue: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  open: { fontSize: 12, marginTop: 2 },
});

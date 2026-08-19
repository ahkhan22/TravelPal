import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lightbox } from '../../../../src/components/Lightbox';
import { PhotoTile } from '../../../../src/components/PhotoTile';
import { RichText, Stars } from '../../../../src/components/inline';
import { daySpend, usd } from '../../../../src/format';
import { persistLocalCopy } from '../../../../src/media';
import { useStore } from '../../../../src/store';
import { useTheme, type Theme } from '../../../../src/theme';
import type { ExpenseSource, Meal, Photo } from '../../../../src/types';

export default function DayScreen() {
  const theme = useTheme();
  const { colors, fonts } = theme;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  const { getTrip, getExpenses, getPhotos, addPhotos } = useStore();

  const [lightbox, setLightbox] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const trip = getTrip(id);
  const dayIndex = Number(day);
  const dayData = trip?.days.find((d) => d.index === dayIndex);

  if (!trip || !dayData) {
    return (
      <View style={[styles.center, { backgroundColor: colors.paper }]}>
        <Text style={{ color: colors.ink }}>Day not found.</Text>
      </View>
    );
  }

  const dayExpenses = getExpenses(trip.id).filter((e) => e.dayIndex === dayIndex);
  const spend = daySpend(getExpenses(trip.id), dayIndex);
  const dayPhotos = getPhotos(trip.id).filter((p) => p.dayIndex === dayIndex);
  const openPhoto = (photoId: string) => router.push(`/trip/${trip.id}/photo/${photoId}`);

  async function importPhotos() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to add pictures to this day.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        selectionLimit: 20,
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (res.canceled) return;
      setImporting(true);
      const copied = await Promise.all(res.assets.map((a) => persistLocalCopy(a.uri, 'photo')));
      addPhotos(copied.map((uri) => ({ tripId: trip!.id, dayIndex, uri })));
    } catch {
      Alert.alert('Import failed', 'Could not add those photos. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Top bar */}
      <View style={[styles.bar, { paddingTop: insets.top + 10, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text
          onPress={() => router.back()}
          style={[styles.back, { color: colors.ink, borderColor: colors.line, fontFamily: fonts.mono }]}
        >
          ← All days
        </Text>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 17 }} numberOfLines={1}>
          Day {dayData.index} · {dayData.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 40, gap: 4 }}>
        <PhotoTile
          gradientIndex={dayData.heroes[0]?.gradient ?? 0}
          caption={dayData.heroes[0]?.caption}
          favorite={dayData.heroes[0]?.favorite}
          aspectRatio={16 / 9}
          style={{ marginBottom: 20 }}
        />

        {/* Spend */}
        <SectionTitle theme={theme} title="This day’s spend" note={`${usd(spend)} on the ground`} />
        <View style={{ marginBottom: 8 }}>
          {dayExpenses.map((e) => (
            <View key={e.id} style={[styles.expRow, { borderColor: colors.line }]}>
              <Text style={[styles.cat, { color: colors.inkSoft, borderColor: colors.line, fontFamily: fonts.mono }]}>{e.category}</Text>
              <Text style={{ flex: 1, color: colors.ink, fontSize: 13.5 }} numberOfLines={1}>
                {e.label}
              </Text>
              {e.receiptPhotoUri ? (
                <Pressable onPress={() => setLightbox(e.receiptPhotoUri!)} accessibilityLabel="View receipt">
                  <Image source={{ uri: e.receiptPhotoUri }} style={[styles.expThumb, { borderColor: colors.line }]} />
                </Pressable>
              ) : null}
              <SourceTag source={e.source} theme={theme} />
              <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 13 }}>{usd(e.amountHome)}</Text>
            </View>
          ))}
        </View>

        {/* Ate */}
        <SectionTitle theme={theme} title="Where I ate" note="receipts kept" />
        {dayData.meals.map((meal) => (
          <MealBlock
            key={meal.id}
            meal={meal}
            theme={theme}
            photos={dayPhotos.filter((p) => p.mealId === meal.id)}
            onOpenPhoto={openPhoto}
          />
        ))}

        {/* Saw */}
        <SectionTitle theme={theme} title="Where I went" />
        <View style={styles.sawGrid}>
          {dayData.places.map((p) => (
            <View key={p.id} style={styles.sawItem}>
              <PhotoTile gradientIndex={p.gradient} caption={p.name} favorite={p.favorite} />
              <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 16, marginTop: 9 }}>{p.name}</Text>
              <Text style={{ color: colors.inkSoft, fontSize: 12.5 }}>{p.note}</Text>
              <PhotoStrip photos={dayPhotos.filter((ph) => ph.placeId === p.id)} onOpenPhoto={openPhoto} />
            </View>
          ))}
        </View>

        {/* Photo roll */}
        <View style={styles.rollHead}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>Photo roll</Text>
          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11 }}>
            {dayPhotos.length > 0 ? `${dayPhotos.length} of yours` : `${dayData.photoCount} sample`}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={importPhotos} disabled={importing} style={[styles.addBtn, { borderColor: colors.teal }]}>
            <Ionicons name={importing ? 'hourglass-outline' : 'add'} size={15} color={colors.teal} />
            <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 11.5 }}>
              {importing ? 'Adding…' : 'Add photos'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.gallery}>
          {dayPhotos.map((p) => (
            <Pressable key={p.id} onPress={() => openPhoto(p.id)} style={styles.galleryItem}>
              <Image source={{ uri: p.uri }} style={[styles.userThumb, { borderColor: colors.line }]} />
              {p.favorite ? (
                <View style={styles.favBadge}>
                  <Ionicons name="heart" size={11} color="#fff" />
                </View>
              ) : null}
              {p.mealId || p.placeId ? <View style={[styles.tagDot, { backgroundColor: colors.saffron }]} /> : null}
            </Pressable>
          ))}
          {dayData.gallery.map((cap, i) => (
            <PhotoTile key={`s${i}`} gradientIndex={i + dayData.index} caption={cap} aspectRatio={1} captionSize={11} style={styles.galleryItem} />
          ))}
        </View>
      </ScrollView>

      <Lightbox uri={lightbox} onClose={() => setLightbox(null)} />
    </View>
  );
}

function MealBlock({
  meal,
  theme,
  photos,
  onOpenPhoto,
}: {
  meal: Meal;
  theme: Theme;
  photos: Photo[];
  onOpenPhoto: (id: string) => void;
}) {
  const { colors, fonts } = theme;
  return (
    <View style={{ marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.line }}>
      <View style={styles.mealRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>{meal.name}</Text>
          <Text style={{ color: colors.inkSoft, fontSize: 12.5 }}>{meal.location}</Text>
          <RichText text={meal.dish} style={{ color: colors.ink, fontSize: 14 }} />
          <Stars rating={meal.rating} />
        </View>
        <View style={[styles.receipt, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
          <View style={[styles.receiptHead, { borderColor: colors.line }]}>
            <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 14 }}>{meal.name}</Text>
            <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 9 }}>↓ {meal.receipt.source}</Text>
          </View>
          {meal.receipt.items.map((it, i) => (
            <View key={i} style={styles.receiptLine}>
              <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 11.5 }}>{it.label}</Text>
              <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11.5 }}>{it.price}</Text>
            </View>
          ))}
          <View style={[styles.receiptTotal, { borderColor: colors.line }]}>
            <Text style={{ color: colors.ink, fontFamily: fonts.mono, fontSize: 12, fontWeight: '700' }}>Total</Text>
            <Text style={{ color: colors.saffron, fontFamily: fonts.mono, fontSize: 12, fontWeight: '700' }}>
              {meal.receipt.total} · {meal.receipt.usd}
            </Text>
          </View>
        </View>
      </View>
      <PhotoStrip photos={photos} onOpenPhoto={onOpenPhoto} />
    </View>
  );
}

function PhotoStrip({ photos, onOpenPhoto }: { photos: Photo[]; onOpenPhoto: (id: string) => void }) {
  const { colors } = useTheme();
  if (photos.length === 0) return null;
  return (
    <View style={styles.strip}>
      {photos.map((p) => (
        <Pressable key={p.id} onPress={() => onOpenPhoto(p.id)}>
          <Image source={{ uri: p.uri }} style={[styles.stripThumb, { borderColor: colors.line }]} />
        </Pressable>
      ))}
    </View>
  );
}

function SectionTitle({ theme, title, note }: { theme: Theme; title: string; note?: string }) {
  const { colors, fonts } = theme;
  return (
    <View style={styles.sectionTitle}>
      <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>{title}</Text>
      {note ? <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11 }}>{note}</Text> : null}
    </View>
  );
}

function SourceTag({ source, theme }: { source: ExpenseSource; theme: Theme }) {
  const { colors, fonts } = theme;
  const color = source === 'scan' ? colors.teal : source === 'email' ? colors.saffron : colors.inkSoft;
  return <Text style={{ color, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.5 }}>{source}</Text>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingBottom: 13, borderBottomWidth: 1 },
  back: { fontSize: 12, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, overflow: 'hidden' },
  sectionTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 24, marginBottom: 12, flexWrap: 'wrap' },
  rollHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, borderBottomWidth: 1 },
  expThumb: { width: 26, height: 26, borderRadius: 5, borderWidth: 1 },
  cat: { fontSize: 9.5, letterSpacing: 0.4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  mealRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  receipt: { flexGrow: 1, minWidth: 220, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 15 },
  receiptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderStyle: 'dashed', paddingBottom: 8, marginBottom: 9 },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 },
  receiptTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderStyle: 'dashed', marginTop: 9, paddingTop: 9 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stripThumb: { width: 54, height: 54, borderRadius: 7, borderWidth: 1 },
  sawGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  sawItem: { flexBasis: '46%', flexGrow: 1 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryItem: { flexBasis: '31%', flexGrow: 1, position: 'relative' },
  userThumb: { width: '100%', aspectRatio: 1, borderRadius: 5, borderWidth: 1 },
  favBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(169,67,42,0.9)', borderRadius: 999, padding: 3 },
  tagDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4 },
});

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
import type { DayMeal, DayPlace, Expense, ExpenseSource, Photo } from '../../../../src/types';

export default function DayScreen() {
  const theme = useTheme();
  const { colors, fonts } = theme;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, day } = useLocalSearchParams<{ id: string; day: string }>();
  const { getTrip, getExpenses, getPhotos, addPhotos, getMeals, getPlaces, deleteMeal, deletePlace } = useStore();

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
  const meals = getMeals(trip.id, dayIndex);
  const places = getPlaces(trip.id, dayIndex);
  const openPhoto = (photoId: string) => router.push(`/trip/${trip.id}/photo/${photoId}`);
  const addEvent = (kind: 'meal' | 'place') => router.push(`/trip/${trip.id}/event?day=${dayIndex}&kind=${kind}`);

  const heroPhoto = dayPhotos.find((p) => p.featured) ?? dayPhotos.find((p) => p.favorite);

  function confirmDeleteMeal(meal: DayMeal) {
    Alert.alert('Remove meal?', `Remove “${meal.name}” from this day?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMeal(meal.id) },
    ]);
  }
  function confirmDeletePlace(place: DayPlace) {
    Alert.alert('Remove place?', `Remove “${place.name}” from this day?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deletePlace(place.id) },
    ]);
  }

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

  // Add a single photo already tagged to a meal or place.
  async function addPhotoTo(tag: { mealId?: string; placeId?: string }) {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow photo access to add a picture.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (res.canceled || !res.assets[0]) return;
      const uri = await persistLocalCopy(res.assets[0].uri, 'photo');
      addPhotos([{ tripId: trip!.id, dayIndex, uri, ...tag }]);
    } catch {
      Alert.alert('Add failed', 'Could not add the photo. Please try again.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.bar, { paddingTop: insets.top + 10, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text onPress={() => router.back()} style={[styles.back, { color: colors.ink, borderColor: colors.line, fontFamily: fonts.mono }]}>
          ← All days
        </Text>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 17 }} numberOfLines={1}>
          Day {dayData.index} · {dayData.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 40, gap: 4 }}>
        <PhotoTile
          uri={heroPhoto?.uri}
          gradientIndex={dayData.heroes[0]?.gradient ?? 0}
          caption={heroPhoto?.caption ?? dayData.heroes[0]?.caption}
          favorite={!!heroPhoto?.favorite}
          aspectRatio={16 / 9}
          style={{ marginBottom: 20 }}
        />

        {/* Spend */}
        <SectionHeader theme={theme} title="This day’s spend" note={`${usd(spend)} on the ground`} />
        <View style={{ marginBottom: 8 }}>
          {dayExpenses.length === 0 ? (
            <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12 }}>
              No expenses yet — tap the Receipt button on the trip screen.
            </Text>
          ) : (
            dayExpenses.map((e) => (
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
            ))
          )}
        </View>

        {/* Ate */}
        <SectionHeader theme={theme} title="Where I ate" onAdd={() => addEvent('meal')} />
        {meals.length === 0 ? (
          <EmptyHint theme={theme} text="No meals yet — tap Add." />
        ) : (
          meals.map((meal) => (
            <MealBlock
              key={meal.id}
              meal={meal}
              theme={theme}
              photos={dayPhotos.filter((p) => p.mealId === meal.id)}
              expense={dayExpenses.find((e) => e.mealId === meal.id)}
              onOpenPhoto={openPhoto}
              onAddPhoto={() => addPhotoTo({ mealId: meal.id })}
              onAddReceipt={() => router.push(`/trip/${trip.id}/receipt?day=${dayIndex}&mealId=${meal.id}`)}
              onViewReceipt={(uri) => setLightbox(uri)}
              onDelete={meal.editable ? () => confirmDeleteMeal(meal) : undefined}
            />
          ))
        )}

        {/* Saw */}
        <SectionHeader theme={theme} title="Where I went" onAdd={() => addEvent('place')} />
        {places.length === 0 ? (
          <EmptyHint theme={theme} text="No places yet — tap Add." />
        ) : (
          <View style={styles.sawGrid}>
            {places.map((p) => {
              const pPhotos = dayPhotos.filter((ph) => ph.placeId === p.id);
              const first = pPhotos[0];
              return (
                <View key={p.id} style={styles.sawItem}>
                  <Pressable onPress={() => (first ? openPhoto(first.id) : addPhotoTo({ placeId: p.id }))}>
                    <PhotoTile uri={first?.uri} gradientIndex={p.gradient ?? p.name.length + dayIndex} caption={p.name} />
                    {!first ? (
                      <View style={styles.addPhotoHint}>
                        <Ionicons name="camera-outline" size={14} color="#fff" />
                        <Text style={styles.addPhotoHintText}>Add photo</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <View style={styles.sawTitleRow}>
                    <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 16, flex: 1 }}>{p.name}</Text>
                    {p.editable ? (
                      <Pressable onPress={() => confirmDeletePlace(p)} hitSlop={8} accessibilityLabel="Remove place">
                        <Ionicons name="trash-outline" size={15} color={colors.inkSoft} />
                      </Pressable>
                    ) : null}
                  </View>
                  {p.note ? <Text style={{ color: colors.inkSoft, fontSize: 12.5 }}>{p.note}</Text> : null}
                  <PhotoStrip photos={pPhotos.slice(1)} onOpenPhoto={openPhoto} onAdd={() => addPhotoTo({ placeId: p.id })} />
                </View>
              );
            })}
          </View>
        )}

        {/* Photo roll */}
        <View style={styles.rollHead}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>Photo roll</Text>
          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11 }}>
            {dayPhotos.length > 0 ? `${dayPhotos.length} of yours` : `${dayData.photoCount} sample`}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={importPhotos} disabled={importing} style={[styles.addBtn, { borderColor: colors.teal }]}>
            <Ionicons name={importing ? 'hourglass-outline' : 'add'} size={15} color={colors.teal} />
            <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 11.5 }}>{importing ? 'Adding…' : 'Add photos'}</Text>
          </Pressable>
        </View>

        <View style={styles.gallery}>
          {dayPhotos.map((p) => (
            <Pressable key={p.id} onPress={() => openPhoto(p.id)} style={styles.galleryItem}>
              <Image source={{ uri: p.uri }} style={[styles.userThumb, { borderColor: colors.line }]} />
              <View style={styles.badges}>
                {p.cover ? (
                  <View style={[styles.badge, { backgroundColor: 'rgba(15,93,99,0.92)' }]}>
                    <Ionicons name="image" size={10} color="#fff" />
                  </View>
                ) : null}
                {p.favorite ? (
                  <View style={[styles.badge, { backgroundColor: 'rgba(169,67,42,0.9)' }]}>
                    <Ionicons name="heart" size={10} color="#fff" />
                  </View>
                ) : null}
                {p.featured ? (
                  <View style={[styles.badge, { backgroundColor: 'rgba(201,138,0,0.92)' }]}>
                    <Ionicons name="star" size={10} color="#fff" />
                  </View>
                ) : null}
              </View>
              {p.mealId || p.placeId ? <View style={[styles.tagDot, { backgroundColor: colors.teal }]} /> : null}
            </Pressable>
          ))}
          {dayPhotos.length === 0 &&
            dayData.gallery.map((cap, i) => (
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
  expense,
  onOpenPhoto,
  onAddPhoto,
  onAddReceipt,
  onViewReceipt,
  onDelete,
}: {
  meal: DayMeal;
  theme: Theme;
  photos: Photo[];
  expense?: Expense;
  onOpenPhoto: (id: string) => void;
  onAddPhoto: () => void;
  onAddReceipt: () => void;
  onViewReceipt: (uri: string) => void;
  onDelete?: () => void;
}) {
  const { colors, fonts } = theme;
  return (
    <View style={{ marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.line, gap: 14 }}>
      <View style={{ gap: 4 }}>
        <View style={styles.mealTitleRow}>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 20, flex: 1 }}>{meal.name}</Text>
          {onDelete ? (
            <Pressable onPress={onDelete} hitSlop={8} accessibilityLabel="Remove meal">
              <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
            </Pressable>
          ) : null}
        </View>
        {meal.location ? <Text style={{ color: colors.inkSoft, fontSize: 12.5 }}>{meal.location}</Text> : null}
        {meal.dish ? <RichText text={meal.dish} style={{ color: colors.ink, fontSize: 14 }} /> : null}
        {meal.rating ? <Stars rating={meal.rating} /> : null}
      </View>

      {meal.receipt ? (
        // Seed meals carry an itemized receipt.
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
      ) : expense ? (
        // A scanned receipt linked to this meal.
        <View style={[styles.linkedReceipt, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 0.5 }}>RECEIPT · {expense.source}</Text>
            <Text style={{ color: colors.saffron, fontFamily: fonts.mono, fontSize: 15, fontWeight: '700', marginTop: 2 }}>
              {usd(expense.amountHome)}
              {expense.local ? ` · ${expense.local.currency} ${expense.local.amount}` : ''}
            </Text>
          </View>
          {expense.receiptPhotoUri ? (
            <Pressable onPress={() => onViewReceipt(expense.receiptPhotoUri!)} accessibilityLabel="View receipt">
              <Image source={{ uri: expense.receiptPhotoUri }} style={[styles.linkedThumb, { borderColor: colors.line }]} />
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Pressable onPress={onAddReceipt} style={[styles.addReceiptBtn, { borderColor: colors.teal }]}>
          <Ionicons name="receipt-outline" size={15} color={colors.teal} />
          <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 12 }}>Add receipt</Text>
        </Pressable>
      )}

      <PhotoStrip photos={photos} onOpenPhoto={onOpenPhoto} onAdd={onAddPhoto} />
    </View>
  );
}

function PhotoStrip({
  photos,
  onOpenPhoto,
  onAdd,
}: {
  photos: Photo[];
  onOpenPhoto: (id: string) => void;
  onAdd?: () => void;
}) {
  const { colors } = useTheme();
  if (photos.length === 0 && !onAdd) return null;
  return (
    <View style={styles.strip}>
      {photos.map((p) => (
        <Pressable key={p.id} onPress={() => onOpenPhoto(p.id)}>
          <Image source={{ uri: p.uri }} style={[styles.stripThumb, { borderColor: colors.line }]} />
        </Pressable>
      ))}
      {onAdd ? (
        <Pressable onPress={onAdd} accessibilityLabel="Add a photo" style={[styles.stripAdd, { borderColor: colors.line }]}>
          <Ionicons name="add" size={20} color={colors.inkSoft} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionHeader({ theme, title, note, onAdd }: { theme: Theme; title: string; note?: string; onAdd?: () => void }) {
  const { colors, fonts } = theme;
  return (
    <View style={styles.sectionTitle}>
      <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>{title}</Text>
      {note ? <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 11 }}>{note}</Text> : null}
      <View style={{ flex: 1 }} />
      {onAdd ? (
        <Pressable onPress={onAdd} style={[styles.addBtn, { borderColor: colors.teal }]}>
          <Ionicons name="add" size={15} color={colors.teal} />
          <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 11.5 }}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyHint({ theme, text }: { theme: Theme; text: string }) {
  const { colors, fonts } = theme;
  return <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12, marginBottom: 8 }}>{text}</Text>;
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
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12, flexWrap: 'wrap' },
  rollHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, borderBottomWidth: 1 },
  expThumb: { width: 26, height: 26, borderRadius: 5, borderWidth: 1 },
  cat: { fontSize: 9.5, letterSpacing: 0.4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  receipt: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 15 },
  linkedReceipt: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, padding: 14 },
  linkedThumb: { width: 46, height: 46, borderRadius: 6, borderWidth: 1 },
  addReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  receiptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderStyle: 'dashed', paddingBottom: 8, marginBottom: 9 },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 },
  receiptTotal: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderStyle: 'dashed', marginTop: 9, paddingTop: 9 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  stripThumb: { width: 54, height: 54, borderRadius: 7, borderWidth: 1 },
  stripAdd: {
    width: 54,
    height: 54,
    borderRadius: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoHint: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  addPhotoHintText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  sawGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  sawItem: { flexBasis: '46%', flexGrow: 1 },
  sawTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryItem: { flexBasis: '31%', flexGrow: 1, position: 'relative' },
  userThumb: { width: '100%', aspectRatio: 1, borderRadius: 5, borderWidth: 1 },
  badges: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', gap: 4 },
  badge: { borderRadius: 999, padding: 3 },
  tagDot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4 },
});

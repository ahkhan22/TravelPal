import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteLocalCopy } from '../../../../src/media';
import { useStore } from '../../../../src/store';
import { useTheme } from '../../../../src/theme';

type Tag = { kind: 'none' } | { kind: 'meal'; id: string } | { kind: 'place'; id: string };

export default function PhotoScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();
  const { getTrip, getPhoto, getAllPhotos, getPhotos, getMeals, getPlaces, updatePhoto, setTripCover, deletePhoto } =
    useStore();

  const photo = getPhoto(photoId);
  const trip = getTrip(id);
  const day = trip?.days.find((d) => d.index === photo?.dayIndex);

  const [caption, setCaption] = useState(photo?.caption ?? '');
  const [favorite, setFavorite] = useState(!!photo?.favorite);
  const [featured, setFeatured] = useState(!!photo?.featured);
  const [cover, setCoverState] = useState(!!photo?.cover);
  const [tag, setTag] = useState<Tag>(
    photo?.mealId ? { kind: 'meal', id: photo.mealId } : photo?.placeId ? { kind: 'place', id: photo.placeId } : { kind: 'none' },
  );
  const [labels, setLabels] = useState<string[]>(photo?.labels ?? []);
  const [newLabel, setNewLabel] = useState('');

  const knownLabels = Array.from(new Set(getAllPhotos().flatMap((p) => p.labels ?? []))).sort();
  const suggestions = knownLabels.filter((l) => !labels.some((x) => x.toLowerCase() === l.toLowerCase()));

  function addLabel(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (!labels.some((x) => x.toLowerCase() === value.toLowerCase())) {
      setLabels((prev) => [...prev, value]);
    }
    setNewLabel('');
  }

  if (!photo || !trip || !day) {
    return (
      <View style={[styles.center, { backgroundColor: colors.paper }]}>
        <Text style={{ color: colors.ink }}>Photo not found.</Text>
      </View>
    );
  }

  const meals = getMeals(id, day.index);
  const places = getPlaces(id, day.index);

  function toggleFeatured() {
    if (!featured) {
      const count = getPhotos(id).filter((p) => p.dayIndex === day!.index && p.featured && p.id !== photo!.id).length;
      if (count >= 2) {
        Alert.alert('Up to 2 per day', 'You can feature up to 2 photos per day in the recap. Unfeature another first.');
        return;
      }
    }
    setFeatured((f) => !f);
  }

  function toggleCover() {
    const next = !cover;
    setCoverState(next);
    setTripCover(photo!.id, next); // applies immediately; clears any other cover
  }

  function save() {
    updatePhoto(photo!.id, {
      caption: caption.trim() || undefined,
      favorite,
      featured,
      mealId: tag.kind === 'meal' ? tag.id : undefined,
      placeId: tag.kind === 'place' ? tag.id : undefined,
      labels: labels.length ? labels : undefined,
    });
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Remove photo?', 'This removes the photo from the trip.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deletePhoto(photo!.id);
          deleteLocalCopy(photo!.uri);
          router.back();
        },
      },
    ]);
  }

  const chip = (label: string, active: boolean, onPress: () => void, accent = colors.teal) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.chip, { borderColor: colors.line }, active && { backgroundColor: accent, borderColor: accent }]}
    >
      <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.head, { paddingTop: insets.top + 12, borderColor: colors.line }]}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>Photo</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={[styles.x, { borderColor: colors.line }]}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 18 }} keyboardShouldPersistTaps="handled">
        <Image source={{ uri: photo.uri }} style={[styles.image, { borderColor: colors.line }]} resizeMode="cover" />

        <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
          <Pressable onPress={() => setFavorite((f) => !f)} style={styles.favRow}>
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? colors.brick : colors.inkSoft} />
            <Text style={{ color: favorite ? colors.brick : colors.inkSoft, fontFamily: fonts.mono, fontSize: 12.5 }}>
              {favorite ? 'Favorite' : 'Favorite'}
            </Text>
          </Pressable>
          <Pressable onPress={toggleFeatured} style={styles.favRow}>
            <Ionicons name={featured ? 'star' : 'star-outline'} size={20} color={featured ? colors.saffron : colors.inkSoft} />
            <Text style={{ color: featured ? colors.saffron : colors.inkSoft, fontFamily: fonts.mono, fontSize: 12.5 }}>
              {featured ? 'Featured this day' : 'Feature this day'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={toggleCover}
          style={[
            styles.coverRow,
            { borderColor: cover ? colors.teal : colors.line, backgroundColor: cover ? colors.surfaceAlt : 'transparent' },
          ]}
        >
          <Ionicons name={cover ? 'image' : 'image-outline'} size={20} color={cover ? colors.teal : colors.inkSoft} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>
              {cover ? 'Trip cover photo' : 'Set as trip cover'}
            </Text>
            <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10.5, marginTop: 2 }}>
              The one photo shown on the trip card &amp; recap header
            </Text>
          </View>
          {cover ? <Ionicons name="checkmark-circle" size={20} color={colors.teal} /> : null}
        </Pressable>

        <Label text="Caption" colors={colors} fonts={fonts} />
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="e.g. Me in front of Minar-e-Pakistan"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
        />

        <Label text={`Tag to something on Day ${day.index}`} colors={colors} fonts={fonts} />
        <View style={styles.chips}>{chip('None', tag.kind === 'none', () => setTag({ kind: 'none' }), colors.inkSoft)}</View>

        {meals.length > 0 && (
          <>
            <Text style={[styles.subLabel, { color: colors.inkSoft, fontFamily: fonts.mono }]}>ATE</Text>
            <View style={styles.chips}>
              {meals.map((m) =>
                chip(m.name, tag.kind === 'meal' && tag.id === m.id, () => setTag({ kind: 'meal', id: m.id }), colors.saffron),
              )}
            </View>
          </>
        )}

        {places.length > 0 && (
          <>
            <Text style={[styles.subLabel, { color: colors.inkSoft, fontFamily: fonts.mono }]}>SAW</Text>
            <View style={styles.chips}>
              {places.map((p) =>
                chip(p.name, tag.kind === 'place' && tag.id === p.id, () => setTag({ kind: 'place', id: p.id }), colors.teal),
              )}
            </View>
          </>
        )}

        <Label text="Tags — search across every trip" colors={colors} fonts={fonts} />
        {labels.length > 0 && (
          <View style={styles.chips}>
            {labels.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLabels((prev) => prev.filter((x) => x !== l))}
                style={[styles.tagChip, { backgroundColor: colors.brick }]}
              >
                <Text style={{ color: '#fff', fontSize: 12.5 }}>{l}</Text>
                <Ionicons name="close" size={13} color="#fff" />
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.tagInputRow}>
          <TextInput
            value={newLabel}
            onChangeText={setNewLabel}
            onSubmitEditing={() => addLabel(newLabel)}
            placeholder="Add a tag, e.g. Outfit"
            placeholderTextColor={colors.inkSoft}
            returnKeyType="done"
            style={[styles.input, { flex: 1, color: colors.ink, borderColor: colors.line }]}
          />
          <Pressable onPress={() => addLabel(newLabel)} style={[styles.addTagBtn, { borderColor: colors.teal }]}>
            <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 13 }}>Add</Text>
          </Pressable>
        </View>
        {suggestions.length > 0 && (
          <View style={styles.chips}>
            {suggestions.map((l) => (
              <Pressable key={l} onPress={() => addLabel(l)} style={[styles.chip, { borderColor: colors.line }]}>
                <Text style={{ color: colors.inkSoft, fontSize: 12 }}>+ {l}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={save} style={[styles.btn, styles.btnPrimary]}>
          <Text style={styles.btnPrimaryText}>Save</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={styles.deleteRow}>
          <Ionicons name="trash-outline" size={16} color={colors.brick} />
          <Text style={{ color: colors.brick, fontFamily: fonts.mono, fontSize: 12.5 }}>Remove photo</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Label({
  text,
  colors,
  fonts,
}: {
  text: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fonts: ReturnType<typeof useTheme>['fonts'];
}) {
  return (
    <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
      {text}
    </Text>
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
  image: { width: '100%', height: 300, borderRadius: 12, borderWidth: 1 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  subLabel: { fontSize: 9.5, letterSpacing: 1, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingLeft: 13, paddingRight: 10, paddingVertical: 7 },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addTagBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 11, marginTop: 6 },
  btnPrimary: { backgroundColor: '#0F5D63' },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 },
});

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../../src/store';
import { useTheme } from '../../../src/theme';

// Add a meal ("ate") or a place ("saw / did") to a day.
export default function EventScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, day, kind } = useLocalSearchParams<{ id: string; day: string; kind: string }>();
  const { addMeal, addPlace } = useStore();

  const isMeal = kind === 'meal';
  const dayIndex = Number(day);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [dish, setDish] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);

  const canSave = name.trim().length > 0;

  function save() {
    if (!canSave) return;
    if (isMeal) {
      addMeal({
        tripId: id,
        dayIndex,
        name: name.trim(),
        location: location.trim() || undefined,
        dish: dish.trim() || undefined,
        rating: rating || undefined,
      });
    } else {
      addPlace({ tripId: id, dayIndex, name: name.trim(), note: note.trim() || undefined });
    }
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.head, { paddingTop: insets.top + 12, borderColor: colors.line }]}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>
          {isMeal ? 'Add a meal' : 'Add a place'}
        </Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={[styles.x, { borderColor: colors.line }]}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Field label={isMeal ? 'Restaurant / meal' : 'Place / activity'} colors={colors} fonts={fonts}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={isMeal ? 'e.g. Butt Karahi' : 'e.g. Badshahi Mosque'}
            placeholderTextColor={colors.inkSoft}
            style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
          />
        </Field>

        {isMeal ? (
          <>
            <Field label="Where (optional)" colors={colors} fonts={fonts}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Lakshmi Chowk"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
              />
            </Field>
            <Field label="What you ordered (optional)" colors={colors} fonts={fonts}>
              <TextInput
                value={dish}
                onChangeText={setDish}
                placeholder="e.g. Mutton karahi + naan"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
              />
            </Field>
            <Field label="Rating (optional)" colors={colors} fonts={fonts}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(rating === n ? 0 : n)} hitSlop={6}>
                    <Text style={{ fontSize: 26, color: n <= rating ? colors.saffron : colors.line }}>★</Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          </>
        ) : (
          <Field label="Note (optional)" colors={colors} fonts={fonts}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Walked the courtyard at sunset"
              placeholderTextColor={colors.inkSoft}
              multiline
              style={[styles.input, { color: colors.ink, borderColor: colors.line, minHeight: 72, textAlignVertical: 'top' }]}
            />
          </Field>
        )}

        <Pressable onPress={save} disabled={!canSave} style={[styles.btn, { backgroundColor: colors.teal }, !canSave && { opacity: 0.5 }]}>
          <Text style={styles.btnText}>{isMeal ? 'Add meal' : 'Add place'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Field({
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
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  x: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 11, marginTop: 6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

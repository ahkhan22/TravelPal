import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usd } from '../../../src/format';
import { persistLocalCopy } from '../../../src/media';
import { useStore } from '../../../src/store';
import { useTheme } from '../../../src/theme';
import type { DayMeal, ExpenseCategory } from '../../../src/types';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Activities', 'Hotel', 'Flights', 'Other'];
const PKR_PER_USD = 281;
type Currency = 'PKR' | 'USD';

export default function ReceiptScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, day, mealId } = useLocalSearchParams<{ id: string; day?: string; mealId?: string }>();
  const { getTrip, addExpense, getMeals } = useStore();
  const trip = getTrip(id);

  const presetDay = day ? Number(day) : (trip?.days.length ?? 1);
  // A meal linked at launch pre-fills the merchant.
  const launchMeal = mealId ? getMeals(id, presetDay).find((m) => m.id === mealId) : undefined;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(presetDay);
  const [mealSel, setMealSel] = useState<string | null>(mealId ?? null);
  const [merchant, setMerchant] = useState(launchMeal?.name ?? '');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [saving, setSaving] = useState(false);

  const dayMeals = dayIndex != null ? getMeals(id, dayIndex) : [];
  const amountNum = Number(amount) || 0;
  const amountHome = currency === 'PKR' ? Math.round(amountNum / PKR_PER_USD) : Math.round(amountNum);
  const canSave = amountNum > 0 && !saving;

  function selectDay(d: number | null) {
    setDayIndex(d);
    setMealSel(null); // meals differ per day
  }
  function selectMeal(m: DayMeal | null) {
    setMealSel(m?.id ?? null);
    if (m) setMerchant(m.name); // autopopulate
  }

  async function capture(mode: 'camera' | 'library') {
    try {
      const perm =
        mode === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow access to add a receipt photo.');
        return;
      }
      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } catch {
      Alert.alert('Could not open camera', 'Something went wrong capturing the receipt.');
    }
  }

  async function save() {
    if (!trip || !canSave) return;
    setSaving(true);
    try {
      const storedUri = imageUri ? await persistLocalCopy(imageUri, 'receipt') : undefined;
      addExpense({
        tripId: trip.id,
        dayIndex,
        label: merchant.trim() || 'Receipt',
        category,
        amountHome,
        local: { amount: amountNum, currency },
        source: 'scan',
        merchant: merchant.trim() || undefined,
        receiptPhotoUri: storedUri,
        mealId: dayIndex != null ? mealSel || undefined : undefined,
      });
      const where = dayIndex != null ? `Day ${dayIndex}` : 'pre-trip expenses';
      Alert.alert('Saved to trip', `${merchant.trim() || 'Receipt'} · ${usd(amountHome)} added to ${where}.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Save failed', 'Could not save this expense. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.head, { paddingTop: insets.top + 12, borderColor: colors.line }]}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>Add a receipt</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={[styles.x, { borderColor: colors.line }]}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 18 }} keyboardShouldPersistTaps="handled">
        {/* Capture area */}
        {imageUri ? (
          <View style={{ gap: 10 }}>
            <Image source={{ uri: imageUri }} style={[styles.preview, { borderColor: colors.line }]} resizeMode="cover" />
            <Pressable onPress={() => setImageUri(null)} style={styles.retake}>
              <Ionicons name="refresh" size={15} color={colors.teal} />
              <Text style={{ color: colors.teal, fontFamily: fonts.mono, fontSize: 12 }}>Retake / choose another</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.capture, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="receipt-outline" size={30} color={colors.inkSoft} />
            <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12, textAlign: 'center' }}>
              Snap or upload your receipt,{'\n'}then add the details below.
            </Text>
            <View style={styles.captureBtns}>
              <Pressable onPress={() => capture('camera')} style={[styles.btn, styles.btnPrimary]}>
                <Ionicons name="camera-outline" size={17} color="#fff" />
                <Text style={styles.btnPrimaryText}>Take photo</Text>
              </Pressable>
              <Pressable onPress={() => capture('library')} style={[styles.btn, styles.btnGhost, { borderColor: colors.line }]}>
                <Ionicons name="images-outline" size={17} color={colors.ink} />
                <Text style={[styles.btnGhostText, { color: colors.ink }]}>Upload</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ gap: 16 }}>
          {/* Day first — it drives the meal options below */}
          <Field label="Which day" colors={colors} fonts={fonts}>
            <View style={styles.chips}>
              <Pressable
                onPress={() => selectDay(null)}
                style={[styles.chip, { borderColor: colors.line }, dayIndex == null && { backgroundColor: colors.inkSoft, borderColor: colors.inkSoft }]}
              >
                <Text style={{ color: dayIndex == null ? '#fff' : colors.ink, fontSize: 12.5 }}>Pre-trip</Text>
              </Pressable>
              {(trip?.days ?? []).map((d) => {
                const active = d.index === dayIndex;
                return (
                  <Pressable
                    key={d.index}
                    onPress={() => selectDay(d.index)}
                    style={[styles.chip, { borderColor: colors.line }, active && { backgroundColor: colors.teal, borderColor: colors.teal }]}
                  >
                    <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 12.5 }}>Day {d.index}</Text>
                  </Pressable>
                );
              })}
            </View>
            {dayIndex == null ? (
              <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10.5, marginTop: 6 }}>
                Not tied to a day — for flights, hotels &amp; anything booked before the trip.
              </Text>
            ) : null}
          </Field>

          {/* Link to a meal on that day (autofills the merchant) */}
          {dayIndex != null && dayMeals.length > 0 ? (
            <Field label="Link to a meal (optional)" colors={colors} fonts={fonts}>
              <View style={styles.chips}>
                <Pressable
                  onPress={() => selectMeal(null)}
                  style={[styles.chip, { borderColor: colors.line }, !mealSel && { backgroundColor: colors.inkSoft, borderColor: colors.inkSoft }]}
                >
                  <Text style={{ color: !mealSel ? '#fff' : colors.ink, fontSize: 12.5 }}>None</Text>
                </Pressable>
                {dayMeals.map((m) => {
                  const active = m.id === mealSel;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => selectMeal(m)}
                      style={[styles.chip, { borderColor: colors.line }, active && { backgroundColor: colors.saffron, borderColor: colors.saffron }]}
                    >
                      <Text style={{ color: active ? colors.onAccent : colors.ink, fontSize: 12.5 }}>{m.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          ) : null}

          <Field label="Merchant" colors={colors} fonts={fonts}>
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Butt Karahi"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
            />
          </Field>

          <Field label="Currency" colors={colors} fonts={fonts}>
            <View style={styles.chips}>
              {(['PKR', 'USD'] as Currency[]).map((c) => {
                const active = c === currency;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={[styles.chip, { borderColor: colors.line }, active && { backgroundColor: colors.teal, borderColor: colors.teal }]}
                  >
                    <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 12.5 }}>{c === 'PKR' ? '₨ PKR' : '$ USD'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label={`Total (${currency})`} colors={colors} fonts={fonts}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.inkSoft}
                style={[styles.input, { flex: 1, color: colors.ink, borderColor: colors.line }]}
              />
              {currency === 'PKR' && amountNum > 0 ? (
                <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 13 }}>≈ {usd(amountHome)}</Text>
              ) : null}
            </View>
          </Field>

          <Field label="Category" colors={colors} fonts={fonts}>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[styles.chip, { borderColor: colors.line }, active && { backgroundColor: colors.saffron, borderColor: colors.saffron }]}
                  >
                    <Text style={{ color: active ? colors.onAccent : colors.ink, fontSize: 12.5 }}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 16 }}>
            Type the total from your receipt for now — automatic reading is coming. PKR converts at ~{PKR_PER_USD} = $1.
          </Text>
        </View>

        <Pressable onPress={save} disabled={!canSave} style={[styles.btn, styles.btnPrimary, styles.save, !canSave && { opacity: 0.5 }]}>
          <Text style={styles.btnPrimaryText}>{saving ? 'Saving…' : 'Save to trip'}</Text>
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
  capture: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 14,
  },
  captureBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  preview: { width: '100%', height: 240, borderRadius: 14, borderWidth: 1 },
  retake: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 4 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 11 },
  btnPrimary: { backgroundColor: '#0F5D63' },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnGhost: { borderWidth: 1 },
  btnGhostText: { fontWeight: '600', fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  save: { marginTop: 4 },
});

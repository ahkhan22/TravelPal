import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usd } from '../../../src/format';
import { useStore } from '../../../src/store';
import { useTheme } from '../../../src/theme';
import type { ExpenseCategory } from '../../../src/types';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Activities', 'Hotel', 'Other'];
const PKR_PER_USD = 281;

// Sample values, standing in for OCR output. Once a receipt image is captured
// TravelPal reads the merchant, total and date; here we prefill an editable
// example so the flow is fully usable end to end.
const EXTRACTED = { merchant: 'Butt Karahi', amountLocal: '3200', currency: 'PKR' };

export default function ReceiptScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTrip, addExpense } = useStore();
  const trip = getTrip(id);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [merchant, setMerchant] = useState(EXTRACTED.merchant);
  const [amountLocal, setAmountLocal] = useState(EXTRACTED.amountLocal);
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [dayIndex, setDayIndex] = useState<number>(trip?.days.length ?? 1);

  const amountHome = Math.round((Number(amountLocal) || 0) / PKR_PER_USD);

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
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Could not open camera', 'Something went wrong capturing the receipt.');
    }
  }

  function save() {
    if (!trip) return;
    addExpense({
      tripId: trip.id,
      dayIndex,
      label: merchant.trim() || 'Receipt',
      category,
      amountHome,
      local: { amount: Number(amountLocal) || 0, currency: EXTRACTED.currency },
      source: 'scan',
      merchant: merchant.trim(),
    });
    Alert.alert('Saved to trip', `${merchant} · ${usd(amountHome)} added to Day ${dayIndex}.`, [
      { text: 'Done', onPress: () => router.back() },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.head, { paddingTop: insets.top + 12, borderColor: colors.line }]}>
        <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 19 }}>Receipt → expense</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" style={[styles.x, { borderColor: colors.line }]}>
          <Ionicons name="close" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30, gap: 18 }}>
        {/* Capture area */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={[styles.preview, { borderColor: colors.line }]} resizeMode="cover" />
        ) : (
          <View style={[styles.capture, { borderColor: colors.line, backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="receipt-outline" size={30} color={colors.inkSoft} />
            <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 12, textAlign: 'center' }}>
              Snap or upload a receipt.{'\n'}TravelPal reads the total and converts the currency.
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

        {/* Extracted / editable fields */}
        <View style={{ gap: 16 }}>
          <Field label="Merchant" colors={colors} fonts={fonts}>
            <TextInput
              value={merchant}
              onChangeText={setMerchant}
              style={[styles.input, { color: colors.ink, borderColor: colors.line }]}
              placeholderTextColor={colors.inkSoft}
            />
          </Field>

          <Field label="Amount (PKR)" colors={colors} fonts={fonts}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TextInput
                value={amountLocal}
                onChangeText={setAmountLocal}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, color: colors.ink, borderColor: colors.line }]}
                placeholderTextColor={colors.inkSoft}
              />
              <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 13 }}>
                ≈ {usd(amountHome)}
              </Text>
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
                    style={[
                      styles.chip,
                      { borderColor: colors.line },
                      active && { backgroundColor: colors.saffron, borderColor: colors.saffron },
                    ]}
                  >
                    <Text style={{ color: active ? colors.onAccent : colors.ink, fontSize: 12.5 }}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Add to day" colors={colors} fonts={fonts}>
            <View style={styles.chips}>
              {(trip?.days ?? []).map((d) => {
                const active = d.index === dayIndex;
                return (
                  <Pressable
                    key={d.index}
                    onPress={() => setDayIndex(d.index)}
                    style={[
                      styles.chip,
                      { borderColor: colors.line },
                      active && { backgroundColor: colors.teal, borderColor: colors.teal },
                    ]}
                  >
                    <Text style={{ color: active ? '#fff' : colors.ink, fontSize: 12.5 }}>Day {d.index}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Text style={{ color: colors.inkSoft, fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 16 }}>
            Converted at ~{PKR_PER_USD} PKR = $1. During a trip, TravelPal assumes new receipts belong to it.
          </Text>
        </View>

        <Pressable onPress={save} style={[styles.btn, styles.btnPrimary, styles.save]}>
          <Text style={styles.btnPrimaryText}>Save to trip</Text>
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

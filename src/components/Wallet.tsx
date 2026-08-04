import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryTotals, daySpend, tripTotal, usd } from '../format';
import { useTheme } from '../theme';
import type { Day, Expense } from '../types';

// The trip wallet: home-currency total, category breakdown, and per-day spend.
// All computed live from the expense list, so a freshly scanned receipt moves
// the numbers immediately.

interface Props {
  expenses: Expense[];
  days: Day[];
  receiptsScanned: number;
  emailReceipts: number;
  onScan: () => void;
}

export function Wallet({ expenses, days, receiptsScanned, emailReceipts, onScan }: Props) {
  const { colors, fonts } = useTheme();
  const total = tripTotal(expenses);
  const cats = categoryTotals(expenses);
  const dayValues = days.map((d) => daySpend(expenses, d.index));
  const maxDay = Math.max(1, ...dayValues);

  return (
    <View style={{ gap: 18 }}>
      <View style={[styles.top, { borderColor: colors.line }]}>
        <View style={{ flexShrink: 1 }}>
          <Text style={[styles.total, { color: colors.ink, fontFamily: fonts.display }]}>
            {usd(total)}
          </Text>
          <Text style={[styles.sub, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
            {receiptsScanned} receipts scanned · {emailReceipts} from email
          </Text>
        </View>
        <Pressable
          onPress={onScan}
          accessibilityRole="button"
          accessibilityLabel="Scan a receipt"
          style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="scan-outline" size={17} color="#fff" />
          <Text style={styles.scanText}>Scan a receipt</Text>
        </Pressable>
      </View>

      <View style={{ gap: 11 }}>
        {cats.map((c) => (
          <View key={c.category} style={styles.catRow}>
            <Text style={[styles.catLabel, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
              {c.category}
            </Text>
            <View style={[styles.track, { backgroundColor: colors.line }]}>
              <View style={[styles.fill, { width: `${Math.max(3, c.share * 100)}%` }]} />
            </View>
            <Text style={[styles.catAmt, { color: colors.ink, fontFamily: fonts.mono }]}>
              {usd(c.amount)}
            </Text>
          </View>
        ))}
      </View>

      <View>
        <View style={styles.barsHead}>
          <Text style={[styles.barsHeadLabel, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
            ON THE GROUND, BY DAY
          </Text>
          <Text style={[styles.barsHeadNote, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
            excludes flights & hotel
          </Text>
        </View>
        <View style={styles.bars}>
          {days.map((d, i) => {
            const v = dayValues[i];
            return (
              <View key={d.index} style={styles.bar}>
                <Text style={[styles.barVal, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
                  {usd(v)}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(4, (v / maxDay) * 100)}%` }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.inkSoft, fontFamily: fonts.mono }]}>
                  D{d.index}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: 1,
    paddingBottom: 18,
  },
  total: { fontSize: 40, fontWeight: '600' },
  sub: { fontSize: 11.5, marginTop: 7 },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F5D63',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 11,
  },
  scanText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catLabel: { width: 92, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  track: { flex: 1, height: 9, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#C98A00' },
  catAmt: { width: 52, textAlign: 'right', fontSize: 13 },
  barsHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  barsHeadLabel: { fontSize: 10.5, letterSpacing: 0.8 },
  barsHeadNote: { fontSize: 10.5 },
  bars: { flexDirection: 'row', gap: 10, height: 130 },
  bar: { flex: 1, alignItems: 'center' },
  barVal: { fontSize: 9.5, marginBottom: 5 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barFill: {
    width: '62%',
    maxWidth: 40,
    minHeight: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#C98A00',
  },
  barLabel: { fontSize: 10, marginTop: 7 },
});

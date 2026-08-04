import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme';

// Renders a string with **bold** segments as emphasized text.
export function RichText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  const parts = text.split('**');
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={{ fontWeight: '700' }}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

// A 0-5 star rating using filled/empty glyphs.
export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const { colors } = useTheme();
  const full = '★'.repeat(rating);
  const empty = '★'.repeat(Math.max(0, 5 - rating));
  return (
    <Text style={{ fontSize: size, letterSpacing: 1 }}>
      <Text style={{ color: colors.saffron }}>{full}</Text>
      <Text style={{ color: colors.line }}>{empty}</Text>
    </Text>
  );
}

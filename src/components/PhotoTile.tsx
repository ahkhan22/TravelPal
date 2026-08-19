import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { gradient } from '../gradients';
import { fonts, radius } from '../theme';

// A trip photo tile. Given a `uri` it shows the real image; otherwise it falls
// back to a colour-ramp placeholder. Either way it keeps the same caption and
// corner-tag chrome, so real and sample photos read as one system.

interface Props {
  gradientIndex?: number;
  uri?: string;
  caption?: string;
  tag?: string;
  favorite?: boolean;
  aspectRatio?: number;
  captionSize?: number;
  style?: StyleProp<ViewStyle>;
}

export function PhotoTile({
  gradientIndex = 0,
  uri,
  caption,
  tag,
  favorite,
  aspectRatio = 4 / 3,
  captionSize = 12.5,
  style,
}: Props) {
  const colors = gradient(gradientIndex);
  return (
    <View style={[styles.wrap, { aspectRatio }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={colors as unknown as [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {(tag || favorite) && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{favorite ? 'favorite' : tag}</Text>
        </View>
      )}
      {caption ? (
        <Text style={[styles.caption, { fontSize: captionSize }]} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#123B57',
  },
  caption: {
    color: '#fff',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: '#fff',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { buildRecapHtml, type RecapHero, type RecapMedia } from './recapHtml';
import type { Expense, Photo, Trip } from './types';

export interface ExportOptions {
  photos?: Photo[];
  includePhotos?: boolean; // default true
  includeSpend?: boolean; // default true
  ateByDay?: Record<number, string[]>;
  sawByDay?: Record<number, string[]>;
}

// Converts a local image into a resized JPEG base64 data URI, so it embeds
// directly into the recap HTML (a PDF can't reference on-device file paths).
// Resizing keeps the PDF small; JPEG output means iOS HEIC photos render too.
async function toDataUri(uri: string): Promise<string | null> {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1000 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    return result.base64 ? `data:image/jpeg;base64,${result.base64}` : null;
  } catch {
    return null;
  }
}

// Featured photos win; favorites are the fallback. Max 2 per day / for the cover.
async function buildMedia(trip: Trip, photos: Photo[]): Promise<Pick<RecapMedia, 'cover' | 'heroesByDay'>> {
  const coverPhoto =
    photos.find((p) => p.featured) ?? photos.find((p) => p.favorite) ?? photos[photos.length - 1];
  const cover = coverPhoto ? await toDataUri(coverPhoto.uri) : null;

  const heroesByDay: Record<number, RecapHero[]> = {};
  for (const day of trip.days) {
    const dayPhotos = photos.filter((p) => p.dayIndex === day.index);
    const featured = dayPhotos.filter((p) => p.featured);
    const favorites = dayPhotos.filter((p) => p.favorite);
    const chosen = (featured.length ? featured : favorites).slice(0, 2);
    const heroes: RecapHero[] = [];
    for (const p of chosen) {
      const uri = await toDataUri(p.uri);
      if (uri) heroes.push({ uri, caption: p.caption, favorite: p.favorite });
    }
    if (heroes.length) heroesByDay[day.index] = heroes;
  }

  return { cover: cover ?? undefined, heroesByDay };
}

// Renders the recap (with the chosen options) to a PDF and opens the native
// share sheet. On platforms without a share sheet, it reports where the file
// was written.
export async function exportRecapPdf(trip: Trip, expenses: Expense[], options: ExportOptions = {}): Promise<void> {
  const includePhotos = options.includePhotos ?? true;
  const includeSpend = options.includeSpend ?? true;
  const photos = options.photos ?? [];

  const media = includePhotos && photos.length ? await buildMedia(trip, photos) : {};
  const html = buildRecapHtml(trip, expenses, {
    ...media,
    includeSpend,
    ateByDay: options.ateByDay,
    sawByDay: options.sawByDay,
  });
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${trip.title} recap`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert('PDF ready', `Your recap was saved to:\n${uri}`);
  }
}

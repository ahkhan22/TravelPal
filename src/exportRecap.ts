import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { buildRecapHtml, type RecapHero, type RecapMedia } from './recapHtml';
import type { Expense, Photo, Trip } from './types';

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

async function buildMedia(trip: Trip, photos: Photo[]): Promise<RecapMedia> {
  const coverPhoto = photos.find((p) => p.favorite) ?? photos[photos.length - 1];
  const cover = coverPhoto ? await toDataUri(coverPhoto.uri) : null;

  const heroesByDay: Record<number, RecapHero[]> = {};
  for (const day of trip.days) {
    const dayPhotos = photos
      .filter((p) => p.dayIndex === day.index)
      .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite))
      .slice(0, 2);
    const heroes: RecapHero[] = [];
    for (const p of dayPhotos) {
      const uri = await toDataUri(p.uri);
      if (uri) heroes.push({ uri, caption: p.caption, favorite: p.favorite });
    }
    if (heroes.length) heroesByDay[day.index] = heroes;
  }

  return { cover: cover ?? undefined, heroesByDay };
}

// Renders the recap (with real photos embedded) to a PDF and opens the native
// share sheet. On platforms without a share sheet, it reports where the file
// was written.
export async function exportRecapPdf(trip: Trip, expenses: Expense[], photos: Photo[] = []): Promise<void> {
  const media = photos.length ? await buildMedia(trip, photos) : {};
  const html = buildRecapHtml(trip, expenses, media);
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

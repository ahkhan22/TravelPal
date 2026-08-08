import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { buildRecapHtml } from './recapHtml';
import type { Expense, Trip } from './types';

// Renders the recap to a PDF and opens the native share sheet. On platforms
// without a share sheet, it reports where the file was written.
export async function exportRecapPdf(trip: Trip, expenses: Expense[]): Promise<void> {
  const html = buildRecapHtml(trip, expenses);
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

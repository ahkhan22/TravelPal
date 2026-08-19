import * as FileSystem from 'expo-file-system/legacy';

// Copies a picked image (camera or library) into the app's document directory
// so it survives restarts — the picker's original URI lives in a cache that the
// OS can clear. Returns the persistent URI, or the original if the copy fails.
export async function persistLocalCopy(uri: string, prefix = 'img'): Promise<string> {
  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) return uri;
    const ext = (uri.split('.').pop() || 'jpg').split('?')[0];
    const dest = `${dir}${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

// Best-effort delete of a file we previously copied in.
export async function deleteLocalCopy(uri?: string): Promise<void> {
  if (!uri || !uri.startsWith('file:')) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

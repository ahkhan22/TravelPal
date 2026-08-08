import AsyncStorage from '@react-native-async-storage/async-storage';

// Thin, failure-tolerant JSON wrapper around AsyncStorage. Reads/writes never
// throw into the app — a corrupt or unavailable store simply behaves as empty.

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures (e.g. storage full); state stays correct in memory.
  }
}

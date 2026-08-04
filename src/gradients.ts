// Placeholder "photo" gradients — stand-ins for the traveller's real pictures.
// Each entry is a colour ramp fed to expo-linear-gradient. In the real app these
// are replaced by actual image URIs; the index is a stable fallback.

export const GRADIENTS: readonly (readonly [string, string, ...string[]])[] = [
  ['#0F5D63', '#123B57', '#A9432A'],
  ['#A9432A', '#C98A00'],
  ['#123B57', '#0F5D63', '#C98A00'],
  ['#5A3B1E', '#A9432A', '#C98A00'],
  ['#0F5D63', '#123B57'],
  ['#2C6E4E', '#0F5D63'],
  ['#123B57', '#2C6E4E'],
  ['#7A2E1C', '#A9432A', '#C98A00'],
];

export function gradient(index: number): readonly [string, string, ...string[]] {
  return GRADIENTS[((index % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];
}

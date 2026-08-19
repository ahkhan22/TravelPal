import type { Photo } from './types';

// The single photo that represents a trip, used for the trips-list card, the
// recap cover, and the PDF cover. Priority: an explicitly set cover, else a
// featured photo, else a favorite, else the most recent — so it's predictable
// but still shows something once any photo exists.
export function pickCoverPhoto(photos: Photo[]): Photo | undefined {
  return (
    photos.find((p) => p.cover) ??
    photos.find((p) => p.featured) ??
    photos.find((p) => p.favorite) ??
    photos[photos.length - 1]
  );
}

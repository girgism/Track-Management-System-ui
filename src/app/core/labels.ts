const GENRE_LABELS: Record<string, string> = {
  HipHop: 'Hip-Hop',
  RnB: 'R&B',
};

export function genreLabel(genre: string): string {
  return GENRE_LABELS[genre] ?? genre;
}

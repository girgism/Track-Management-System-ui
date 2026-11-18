// Enum values are serialized by the API with JsonStringEnumConverter, i.e. the C# member names.
export type TrackStatus = 'Draft' | 'Submitted' | 'Distributed';
export type DistributionStatus = 'Pending' | 'Live' | 'Rejected';

export const TRACK_STATUSES: readonly TrackStatus[] = ['Draft', 'Submitted', 'Distributed'];

export function isTrackStatus(value: unknown): value is TrackStatus {
  return TRACK_STATUSES.includes(value as TrackStatus);
}

export interface TrackListItem {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  isrc: string;
  releaseDate: string; // yyyy-MM-dd
  genre: string;
  status: TrackStatus;
}

export interface Artist {
  id: string;
  name: string;
  email: string;
  country: string;
}

export interface TrackDistribution {
  id: string;
  dspId: string;
  dspName: string;
  submittedAt: string; // ISO 8601 with offset
  status: DistributionStatus;
}

export interface TrackDetail {
  id: string;
  title: string;
  artist: Artist;
  isrc: string;
  releaseDate: string;
  genre: string;
  status: TrackStatus;
  distributions: TrackDistribution[];
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresAtUtc: string;
}

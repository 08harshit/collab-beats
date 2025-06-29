export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumCoverUrl: string;
  duration: number;
  votes?: Vote[];
  voteCount?: number;
  userVote?: number | null; // -1, 0, or 1
  addedBy?: {
    id: number;
    name: string;
  };
  addedAt?: string;
  spotifyId?: string;
}

export interface Vote {
  id: number;
  songId: number;
  userId: number;
  voteValue: number; // -1 or 1
  votedAt: string;
}

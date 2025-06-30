export interface Vote {
  id: number;
  userId: number;
  voteValue: -1 | 1;
  votedAt: Date;
}

export interface VoteResult {
  voteCount: number;
  userVote: number | null;
}

export interface VoteRequest {
  userId: number;
  voteValue: -1 | 1;
  roomId: number;
}

export interface RemoveVoteRequest {
  userId: number;
  roomId: number;
}

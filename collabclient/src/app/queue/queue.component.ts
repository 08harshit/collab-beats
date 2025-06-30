import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';
import { VoteService } from '../services/vote.service';
import { Subscription } from 'rxjs';

interface Song {
  id: number;
  title: string;
  artist: string;
  albumArtUrl: string;
  spotifyId?: string;  // Add Spotify ID for playback
  addedBy?: {
    id: number;
    name: string;
  };
  votes?: any[];
  voteCount?: number;
  userVote?: number | null; // -1, 0, or 1
  addedAt?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class QueueComponent implements OnInit, OnDestroy, OnChanges {
  @Input() songs: Song[] = [];
  @Input() roomId: string = '';
  @Input() userId: number = 0;
  @Output() playSong = new EventEmitter<string>(); // Emit Spotify ID when song is clicked
  @Output() songsUpdated = new EventEmitter<Song[]>(); // Emit updated songs when vote changes
  private socketSubscription?: Subscription;

  constructor(
    private socketService: SocketService,
    private voteService: VoteService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['songs'] && changes['songs'].currentValue) {
      this.processSongsWithVotes();
    }
  }

  ngOnInit(): void {
    this.subscribeToSocketEvents();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  private subscribeToSocketEvents(): void {
    this.socketSubscription = this.socketService.onRoomUpdate().subscribe({
      next: (update) => {
        if (update.type === 'voteUpdated') {
          this.handleVoteUpdate(update.data);
        }
        // Note: 'songAdded' events are handled by the parent room component
      },
      error: (error) => {
        console.error('[Queue] Socket error:', error);
      }
    });
  }

  /**
   * Handles song click events - emits Spotify ID for playback if available
   */
  onSongClick(song: Song): void {
    if (song.spotifyId) {
      this.playSong.emit(song.spotifyId);
    }
  }

  /**
   * Handles upvoting a song. If the user has already upvoted, the vote is removed (toggle behavior).
   */
  upvoteSong(songId: number): void {
    if (!this.isValidVoteContext(songId)) return;

    const song = this.songs.find(s => s.id === songId);
    if (!song) return;

    const isToggleRemove = song.userVote === 1;
    const voteAction = isToggleRemove
      ? this.voteService.removeVote(songId, this.userId, +this.roomId)
      : this.voteService.voteSong(songId, this.userId, 1, +this.roomId);

    voteAction.subscribe({
      next: (result) => this.updateSongVote(songId, result),
      error: (error) => console.error('[Queue] Voting error:', error)
    });
  }

  /**
   * Handles downvoting a song. If the user has already downvoted, the vote is removed (toggle behavior).
   */
  downvoteSong(songId: number): void {
    if (!this.isValidVoteContext(songId)) return;

    const song = this.songs.find(s => s.id === songId);
    if (!song) return;

    const isToggleRemove = song.userVote === -1;
    const voteAction = isToggleRemove
      ? this.voteService.removeVote(songId, this.userId, +this.roomId)
      : this.voteService.voteSong(songId, this.userId, -1, +this.roomId);

    voteAction.subscribe({
      next: (result) => this.updateSongVote(songId, result),
      error: (error) => console.error('[Queue] Voting error:', error)
    });
  }

      /**
   * Processes songs with vote information. Preserves backend-calculated values when available,
   * falls back to client-side calculation from votes array if needed.
   */
  private processSongsWithVotes(): void {
    this.songs = this.songs.map(song => {
      const votes = song.votes || [];

      // Preserve backend-calculated values, only recalculate if not provided
      const voteCount = this.getVoteCount(song, votes);
      const userVote = this.getUserVote(song, votes);

      return { ...song, voteCount, userVote };
    });

    this.sortSongsByVotes();
  }

  /**
   * Gets the vote count for a song, preferring backend value over client calculation
   */
  private getVoteCount(song: Song, votes: any[]): number {
    if (typeof song.voteCount === 'number') {
      return song.voteCount;
    }
    return votes.reduce((sum: number, vote: any) => sum + (vote.voteValue || 0), 0);
  }

  /**
   * Gets the user's vote for a song, preferring backend value over client calculation
   */
  private getUserVote(song: Song, votes: any[]): number | null {
    if (song.userVote !== undefined && song.userVote !== null) {
      return song.userVote;
    }
    const userVoteData = votes.find((vote: any) => vote.userId === this.userId);
    return userVoteData?.voteValue || null;
  }

  /**
   * Sorts songs by vote count (descending), then by added time (ascending)
   */
  private sortSongsByVotes(): void {
    this.songs.sort((a, b) => {
      const voteCountDiff = (b.voteCount || 0) - (a.voteCount || 0);
      if (voteCountDiff !== 0) return voteCountDiff;

      // If votes are equal, sort by time added (older first)
      const dateA = new Date(a.addedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.addedAt || b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }

  /**
   * Validates that the voting context is valid (user and room are set)
   */
  private isValidVoteContext(songId: number): boolean {
    if (!this.userId || !this.roomId) {
      console.error('[Queue] Cannot vote: missing userId or roomId');
      return false;
    }
    if (!songId || songId <= 0) {
      console.error('[Queue] Cannot vote: invalid songId');
      return false;
    }
    return true;
  }

  /**
   * Updates a specific song's vote information and notifies parent component
   */
  private updateSongVote(songId: number, voteResult: { voteCount: number; userVote: number | null }): void {
    const songIndex = this.songs.findIndex(s => s.id === songId);
    if (songIndex === -1) return;

    this.songs[songIndex] = {
      ...this.songs[songIndex],
      voteCount: voteResult.voteCount,
      userVote: voteResult.userVote
    };

    this.sortSongsByVotes();
    this.songsUpdated.emit(this.songs);
  }

  /**
   * Handles real-time vote updates from WebSocket
   */
  private handleVoteUpdate(data: any): void {
    if (data?.songId && data?.voteResult) {
      this.updateSongVote(data.songId, data.voteResult);
    }
  }
}

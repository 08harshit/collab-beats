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
  ) {
    console.log('[Queue] Component constructor called');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[Queue] Input changes detected:', changes);
    if (changes['songs']) {
      console.log('[Queue] Songs updated:', this.songs);
      this.processSongsWithVotes();
    }
  }

  ngOnInit(): void {
    console.log('[Queue] Component initialized with songs:', this.songs);
    this.subscribeToSocketEvents();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  private subscribeToSocketEvents(): void {
    // Listen for room updates from other users
    console.log('[Queue] Subscribing to WebSocket events');
    this.socketSubscription = this.socketService.onRoomUpdate().subscribe({
      next: (update) => {
        console.log('[Queue] WebSocket event received:', update);
        if (update.type === 'songAdded') {
          console.log('[Queue] Song added by another user, notifying parent needed');
          // Note: We could emit an event to parent to refresh room data
          // For now, the parent room component should handle this
        } else if (update.type === 'voteUpdated') {
          console.log('[Queue] Vote updated, refreshing song data');
          this.handleVoteUpdate(update.data);
        }
      },
      error: (error) => {
        console.error('[Queue] Socket error:', error);
      }
    });
  }

  // Play song when clicked
  onSongClick(song: Song): void {
    console.log('[Queue] Song clicked:', song.title);
    if (song.spotifyId) {
      // Emit the Spotify ID to parent component
      this.playSong.emit(song.spotifyId);
    } else {
      console.warn('[Queue] No Spotify ID found for song:', song.title);
    }
  }

  // Voting functionality
  upvoteSong(songId: number): void {
    console.log('[Queue] Upvote song:', songId);
    if (!this.userId || !this.roomId) {
      console.error('[Queue] Missing userId or roomId for voting');
      return;
    }

    const song = this.songs.find(s => s.id === songId);
    if (!song) return;

    // If user already upvoted, remove vote (toggle)
    if (song.userVote === 1) {
      this.voteService.removeVote(songId, this.userId, +this.roomId).subscribe({
        next: (result) => {
          console.log('[Queue] Vote removed:', result);
          this.updateSongVote(songId, result);
        },
        error: (error) => {
          console.error('[Queue] Error removing vote:', error);
        }
      });
    } else {
      // Cast upvote
      this.voteService.voteSong(songId, this.userId, 1, +this.roomId).subscribe({
        next: (result) => {
          console.log('[Queue] Upvote cast:', result);
          this.updateSongVote(songId, result);
        },
        error: (error) => {
          console.error('[Queue] Error casting upvote:', error);
        }
      });
    }
  }

  downvoteSong(songId: number): void {
    console.log('[Queue] Downvote song:', songId);
    if (!this.userId || !this.roomId) {
      console.error('[Queue] Missing userId or roomId for voting');
      return;
    }

    const song = this.songs.find(s => s.id === songId);
    if (!song) return;

    // If user already downvoted, remove vote (toggle)
    if (song.userVote === -1) {
      this.voteService.removeVote(songId, this.userId, +this.roomId).subscribe({
        next: (result) => {
          console.log('[Queue] Vote removed:', result);
          this.updateSongVote(songId, result);
        },
        error: (error) => {
          console.error('[Queue] Error removing vote:', error);
        }
      });
    } else {
      // Cast downvote
      this.voteService.voteSong(songId, this.userId, -1, +this.roomId).subscribe({
        next: (result) => {
          console.log('[Queue] Downvote cast:', result);
          this.updateSongVote(songId, result);
        },
        error: (error) => {
          console.error('[Queue] Error casting downvote:', error);
        }
      });
    }
  }

    private processSongsWithVotes(): void {
    // Process songs to calculate vote counts and user votes
    this.songs = this.songs.map(song => {
      const votes = song.votes || [];
      const voteCount = votes.reduce((sum: number, vote: any) => sum + vote.voteValue, 0);
      const userVote = votes.find((vote: any) => vote.userId === this.userId)?.voteValue || null;

      return {
        ...song,
        voteCount,
        userVote
      };
    });

    // Sort songs by vote count (descending), then by added time (ascending)
    this.songs.sort((a, b) => {
      const voteCountA = a.voteCount || 0;
      const voteCountB = b.voteCount || 0;

      if (voteCountA !== voteCountB) {
        return voteCountB - voteCountA; // Higher votes first
      }

      // If votes are equal, sort by addedAt or createdAt (older first)
      const dateA = new Date(a.addedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.addedAt || b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }

  private updateSongVote(songId: number, voteResult: any): void {
    const songIndex = this.songs.findIndex(s => s.id === songId);
    if (songIndex !== -1) {
      this.songs[songIndex] = {
        ...this.songs[songIndex],
        voteCount: voteResult.voteCount,
        userVote: voteResult.userVote
      };

      // Emit updated songs to parent for potential re-sorting
      this.songsUpdated.emit(this.songs);
    }
  }

  private handleVoteUpdate(data: any): void {
    if (data && data.songId && data.voteResult) {
      this.updateSongVote(data.songId, data.voteResult);
    }
  }
}

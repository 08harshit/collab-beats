import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';
import { Subscription } from 'rxjs';

interface Song {
  id: number;
  title: string;
  artist: string;
  albumArtUrl: string;
  spotifyId?: string;  // Add Spotify ID for playback
  addedBy?: {
    name: string;
  };
  votes?: number;
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
  @Output() playSong = new EventEmitter<string>(); // Emit Spotify ID when song is clicked
  private socketSubscription?: Subscription;

  constructor(private socketService: SocketService) {
    console.log('[Queue] Component constructor called');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('[Queue] Input changes detected:', changes);
    if (changes['songs']) {
      console.log('[Queue] Songs updated:', this.songs);
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

  // Voting functionality (display only for now)
  upvoteSong(songId: number): void {
    console.log('[Queue] Upvote song:', songId);
    // TODO: Implement actual voting logic later
  }

  downvoteSong(songId: number): void {
    console.log('[Queue] Downvote song:', songId);
    // TODO: Implement actual voting logic later
  }
}

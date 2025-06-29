import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';
import { Subscription } from 'rxjs';

interface Song {
  id: number;
  title: string;
  artist: string;
  albumArtUrl: string;
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

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../services/socket.service';
import { RoomService } from '../services/room.service';
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
export class QueueComponent implements OnInit, OnDestroy {
  @Input() roomId: string = '';
  songs: Song[] = [];
  private socketSubscription?: Subscription;

  constructor(
    private socketService: SocketService,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.loadRoomSongs();
    this.subscribeToSocketEvents();
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  private loadRoomSongs(): void {
    if (this.roomId) {
      console.log(`[Queue] Loading songs for room: ${this.roomId}`);
      this.roomService.getRoomDetails(this.roomId).subscribe({
        next: (room) => {
          this.songs = room.songs || [];
          console.log(`[Queue] Loaded ${this.songs.length} songs:`, this.songs);
        },
        error: (error) => {
          console.error('[Queue] Error loading room songs:', error);
        }
      });
    }
  }

  private subscribeToSocketEvents(): void {
    // Listen for room updates (song added, removed, etc.)
    console.log('[Queue] Subscribing to WebSocket events');
    this.socketSubscription = this.socketService.onRoomUpdate().subscribe({
      next: (update) => {
        console.log('[Queue] WebSocket event received:', update);
        if (update.type === 'songAdded') {
          console.log('[Queue] Song added event received, reloading queue');
          // Reload songs when a new song is added
          this.loadRoomSongs();
        }
      },
      error: (error) => {
        console.error('[Queue] Socket error:', error);
      }
    });
  }

  // Voting functionality (display only for now)
  upvoteSong(songId: number): void {
    console.log('Upvote song:', songId);
    // TODO: Implement actual voting logic later
  }

  downvoteSong(songId: number): void {
    console.log('Downvote song:', songId);
    // TODO: Implement actual voting logic later
  }
}

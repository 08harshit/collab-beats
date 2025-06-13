import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService, QueueItem } from '../services/queue.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="queue-container">
      <div class="queue-header">
        <h2>Queue</h2>
        <button
          *ngIf="queue.length > 0"
          class="clear-queue-btn"
          (click)="clearQueue()"
        >
          Clear Queue
        </button>
      </div>

      <div class="queue-list" *ngIf="queue.length > 0; else emptyQueue">
        <div
          *ngFor="let item of queue; let i = index"
          class="queue-item"
          [class.playing]="item.status === 'playing'"
        >
          <div class="song-info">
            <img
              [src]="item.song.albumArtUrl"
              [alt]="item.song.title"
              class="album-art"
            />
            <div class="song-details">
              <h3>{{ item.song.title }}</h3>
              <p>{{ item.song.artist }}</p>
              <p class="added-by">
                Added by {{ item.user.name }}
                {{ item.addedAt | date: 'short' }}
              </p>
            </div>
          </div>

          <div class="queue-actions">
            <button
              *ngIf="item.status !== 'playing'"
              class="remove-btn"
              (click)="removeFromQueue(item.id)"
            >
              Remove
            </button>
            <button
              *ngIf="item.status !== 'playing'"
              class="move-up-btn"
              (click)="moveInQueue(i, i - 1)"
              [disabled]="i === 0"
            >
              ↑
            </button>
            <button
              *ngIf="item.status !== 'playing'"
              class="move-down-btn"
              (click)="moveInQueue(i, i + 1)"
              [disabled]="i === queue.length - 1"
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      <ng-template #emptyQueue>
        <div class="empty-queue">
          <p>No songs in queue</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .queue-container {
        padding: 1rem;
        background: #1a1a1a;
        border-radius: 8px;
        color: white;
      }

      .queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .clear-queue-btn {
        background: #ff4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
      }

      .queue-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .queue-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #2a2a2a;
        border-radius: 4px;
      }

      .queue-item.playing {
        background: #3a3a3a;
        border-left: 4px solid #1db954;
      }

      .song-info {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .album-art {
        width: 60px;
        height: 60px;
        border-radius: 4px;
      }

      .song-details {
        h3 {
          margin: 0;
          font-size: 1rem;
        }

        p {
          margin: 0.25rem 0;
          color: #b3b3b3;
          font-size: 0.875rem;
        }

        .added-by {
          font-size: 0.75rem;
          color: #808080;
        }
      }

      .queue-actions {
        display: flex;
        gap: 0.5rem;
      }

      button {
        background: #404040;
        color: white;
        border: none;
        padding: 0.5rem;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: #505050;
        }

        &:disabled {
          background: #303030;
          cursor: not-allowed;
        }
      }

      .remove-btn {
        background: #ff4444;
        &:hover {
          background: #ff6666;
        }
      }

      .empty-queue {
        text-align: center;
        padding: 2rem;
        color: #808080;
      }
    `,
  ],
})
export class QueueComponent implements OnInit, OnDestroy {
  @Input() songs: QueueItem[] = [];
  queue: QueueItem[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private queueService: QueueService) {}

  ngOnInit() {
    // Subscribe to queue updates
    this.subscriptions.push(
      this.queueService.queue$.subscribe((queue) => {
        this.queue = queue;
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  removeFromQueue(queueId: number) {
    const userDetails = localStorage.getItem('user_details');
    if (!userDetails) return;

    const userData = JSON.parse(userDetails);
    const roomId = localStorage.getItem('roomCode');

    if (roomId) {
      this.queueService.removeFromQueueSocket(roomId, queueId, userData.id);
    }
  }

  moveInQueue(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= this.queue.length) return;

    const userDetails = localStorage.getItem('user_details');
    if (!userDetails) return;

    const userData = JSON.parse(userDetails);
    const roomId = localStorage.getItem('roomCode');

    if (roomId) {
      this.queueService.moveInQueueSocket(roomId, fromIndex, toIndex, userData.id);
    }
  }

  clearQueue() {
    const userDetails = localStorage.getItem('user_details');
    if (!userDetails) return;

    const userData = JSON.parse(userDetails);
    const roomId = localStorage.getItem('roomCode');

    if (roomId) {
      this.queueService.clearQueueSocket(roomId, userData.id);
    }
  }
}

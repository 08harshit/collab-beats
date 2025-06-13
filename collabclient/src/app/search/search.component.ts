import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService, SpotifyTrack } from '../services/search.service';
import { QueueService } from '../services/queue.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <div class="search-input">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch($event)"
          placeholder="Search for songs..."
        />
        <div class="loading-spinner" *ngIf="loading$ | async"></div>
      </div>

      <div class="error-message" *ngIf="error$ | async as error">
        {{ error }}
      </div>

      <div class="search-results" *ngIf="(searchResults$ | async)?.length">
        <div
          *ngFor="let track of searchResults$ | async"
          class="track-item"
          (click)="addToQueue(track)"
        >
          <img
            [src]="track.album.images[0]?.url"
            [alt]="track.name"
            class="album-art"
          />
          <div class="track-info">
            <h3>{{ track.name }}</h3>
            <p>{{ getArtistNames(track) }}</p>
            <p class="album-name">{{ track.album.name }}</p>
          </div>
          <div class="track-duration">
            {{ formatDuration(track.duration_ms) }}
          </div>
        </div>
      </div>

      <div class="no-results" *ngIf="!(searchResults$ | async)?.length && searchQuery">
        No results found
      </div>
    </div>
  `,
  styles: [
    `
      .search-container {
        padding: 1rem;
        background: #1a1a1a;
        border-radius: 8px;
        color: white;
      }

      .search-input {
        position: relative;
        margin-bottom: 1rem;

        input {
          width: 100%;
          padding: 0.75rem;
          background: #2a2a2a;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 1rem;

          &:focus {
            outline: none;
            box-shadow: 0 0 0 2px #1db954;
          }
        }

        .loading-spinner {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border: 2px solid #1db954;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }

      .error-message {
        color: #ff4444;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: rgba(255, 68, 68, 0.1);
        border-radius: 4px;
      }

      .search-results {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .track-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        background: #2a2a2a;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #3a3a3a;
        }
      }

      .album-art {
        width: 50px;
        height: 50px;
        border-radius: 4px;
        margin-right: 1rem;
      }

      .track-info {
        flex: 1;

        h3 {
          margin: 0;
          font-size: 1rem;
        }

        p {
          margin: 0.25rem 0;
          color: #b3b3b3;
          font-size: 0.875rem;
        }

        .album-name {
          font-size: 0.75rem;
          color: #808080;
        }
      }

      .track-duration {
        color: #b3b3b3;
        font-size: 0.875rem;
      }

      .no-results {
        text-align: center;
        padding: 2rem;
        color: #808080;
      }

      @keyframes spin {
        to {
          transform: translateY(-50%) rotate(360deg);
        }
      }
    `,
  ],
})
export class SearchComponent implements OnInit, OnDestroy {
  searchQuery = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private searchService: SearchService,
    private queueService: QueueService,
  ) {}

  ngOnInit() {
    // Subscribe to search results
    this.subscriptions.push(
      this.searchService.searchResults$.subscribe(),
      this.searchService.loading$.subscribe(),
      this.searchService.error$.subscribe(),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onSearch(query: string) {
    this.searchService.search(query);
  }

  addToQueue(track: SpotifyTrack) {
    const userDetails = localStorage.getItem('user_details');
    if (!userDetails) return;

    const userData = JSON.parse(userDetails);
    const roomId = localStorage.getItem('roomCode');
    const userId = parseInt(userData.id, 10);

    if (roomId && !isNaN(userId)) {
      this.queueService
        .addToQueue(roomId, track.id, userId)
        .subscribe({
          next: () => {
            this.searchService.clearSearch();
            this.searchQuery = '';
          },
          error: (error) => {
            console.error('Failed to add song to queue:', error);
          },
        });
    }
  }

  get searchResults$() {
    return this.searchService.searchResults$;
  }

  get loading$() {
    return this.searchService.loading$;
  }

  get error$() {
    return this.searchService.error$;
  }

  getArtistNames(track: SpotifyTrack): string {
    return track.artist;
  }

  formatDuration(duration_ms: number): string {
    const minutes = Math.floor(duration_ms / 60000);
    const seconds = Math.floor((duration_ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

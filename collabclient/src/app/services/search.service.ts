import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
}

export interface SearchResponse {
    items: SpotifyTrack[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private apiUrl = environment.apiUrl;
  private searchSubject = new BehaviorSubject<string>('');
  private searchResultsSubject = new BehaviorSubject<SpotifyTrack[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  searchResults$ = this.searchResultsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {
    // Set up search with debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query.trim()) {
            this.searchResultsSubject.next([]);
            return [];
          }
          this.loadingSubject.next(true);
          return this.searchTracks(query);
        }),
      )
      .subscribe({
        next: (response) => {
          console.log('Search response:', response);
          this.searchResultsSubject.next(response.items);
          this.loadingSubject.next(false);
          this.errorSubject.next(null);
        },
        error: (error) => {
          this.searchResultsSubject.next([]);
          this.loadingSubject.next(false);
          this.errorSubject.next(error.message || 'Failed to search tracks');
        },
      });
  }

  search(query: string): void {
    this.searchSubject.next(query);
  }

  private searchTracks(query: string): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.apiUrl}/search/songs`, {
      params: { q: query },
    });
  }

  clearSearch(): void {
    this.searchSubject.next('');
    this.searchResultsSubject.next([]);
    this.errorSubject.next(null);
  }
}

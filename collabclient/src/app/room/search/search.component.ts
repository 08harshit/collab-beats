import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SongService } from '../../services/song.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @Input() roomId: string = '';
  @Input() userId: number = 0; // Receive database user ID from parent
  @Output() songAdded = new EventEmitter<any>();
  searchControl = new FormControl();
  results$: Observable<any> = EMPTY;

  constructor(private songService: SongService) {}

  ngOnInit(): void {
    this.results$ = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query) {
          return this.songService.search(query);
        } else {
          return EMPTY;
        }
      })
    );
  }

  addSong(song: any) {
    if (!this.roomId) {
      console.error('[Search] No room ID provided');
      return;
    }

    if (!this.userId) {
      console.error('[Search] No user ID provided');
      return;
    }

    console.log('[Search] Adding song to queue:', song);
    console.log('[Search] Room ID:', this.roomId, 'User ID:', this.userId);

    // Add song to queue with complete song data and user ID
    this.songService.addSongToQueue(this.roomId, song, this.userId).subscribe({
      next: (response) => {
        console.log('[Search] Song successfully added to queue:', response);
        // Emit the updated room data to parent
        this.songAdded.emit(response);
      },
      error: (error) => {
        console.error('[Search] Error adding song to queue:', error);
      }
    });
  }
}

import { Component, OnInit, Input } from '@angular/core';
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
    if (this.roomId) {
      const userId = Number(localStorage.getItem('user_id'));
      if (userId) {
        console.log('[Search] Adding song to queue:', song);
        console.log('[Search] Room ID:', this.roomId, 'User ID:', userId);
        // Add song to queue with complete song data and user ID
        this.songService.addSongToQueue(this.roomId, song, userId).subscribe({
          next: (response) => {
            console.log('[Search] Song successfully added to queue:', response);
          },
          error: (error) => {
            console.error('[Search] Error adding song to queue:', error);
          }
        });
      } else {
        console.error('[Search] No user ID found in localStorage');
      }
    } else {
      console.error('[Search] No room ID provided');
    }
  }
}

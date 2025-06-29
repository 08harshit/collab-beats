import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SongService } from '../../services/song.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';

@Component({
  selector: 'app-add-song',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-song.component.html',
  styleUrls: ['./add-song.component.scss']
})
export class AddSongComponent implements OnInit {
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
        // Add song to queue with complete song data and user ID
        this.songService.addSongToQueue(this.roomId, song, userId).subscribe();
      }
    }
  }
}

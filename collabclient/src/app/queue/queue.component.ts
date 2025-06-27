import { Component, Input } from '@angular/core';
import { Song } from '../interfaces/song.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class QueueComponent {
  @Input() songs: Song[] = [];
}

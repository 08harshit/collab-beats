import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-queue',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './queue.component.html',
  styleUrl: './queue.component.scss'
})
export class QueueComponent {

@Input() songs: any[] = [];
}

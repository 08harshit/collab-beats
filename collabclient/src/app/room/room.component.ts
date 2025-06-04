import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { QueueComponent } from "../queue/queue.component";
import { Router } from '@angular/router';
import { RoomService } from '../services/room.service';
import type { RoomResponse } from '../services/room.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, HttpClientModule, QueueComponent],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent implements OnInit {
  loading = true;
  roomCode: string = '';
  userName: string = '';
  userId: string = '';
  room: RoomResponse | null = null;
  error: string | null = '';

  // Mock data for static display
  // users = [
  //   { id: '1', name: 'User 1', avatar: 'https://via.placeholder.com/40' },
  //   { id: '2', name: 'User 2', avatar: 'https://via.placeholder.com/40' },
  //   { id: '3', name: 'User 3', avatar: 'https://via.placeholder.com/40' }
  // ];

  songs = [
    { id: '1', title: 'Song 1', artist: 'Artist 1', duration: '3:45', addedBy: 'User 1' },
    { id: '2', title: 'Song 2', artist: 'Artist 2', duration: '4:20', addedBy: 'User 2' },
    { id: '3', title: 'Song 3', artist: 'Artist 3', duration: '2:55', addedBy: 'User 3' }
  ];

  currentSong = {
    title: 'Now Playing: Song 1',
    artist: 'Artist 1',
    cover: 'https://via.placeholder.com/300',
    progress: 45
  };

  constructor(private http: HttpClient, private router: Router, private roomService: RoomService) {}

  ngOnInit(): void {
    const userDetails = localStorage.getItem('user_details');
    this.userId = userDetails ? JSON.parse(userDetails).id : '';
    this.userName = userDetails ? JSON.parse(userDetails).name : 'Guest';

    if (!this.userId) {
      this.error = 'User not logged in';
      this.loading = false;
      return;
    }

    const existingRoomCode = localStorage.getItem('roomCode');
    if (existingRoomCode) {
      this.roomCode = existingRoomCode;
      this.joinExistingRoom(existingRoomCode);
    } else {
      this.loading = false;
    }
  }

  async joinExistingRoom(code: string): Promise<void> {
    try {
      const room = await firstValueFrom(this.roomService.getRoomByCode(code));
      if (room?.id) {
        this.room = room;
        this.roomCode = room.code;
        await firstValueFrom(this.roomService.joinRoom(room.id, this.userId));
        this.loading = false;
      } else {
        throw new Error('Room not found');
      }
    } catch (error) {
      this.error = 'Failed to join room. Please check the room code.';
      this.loading = false;
      this.roomCode = '';
      localStorage.removeItem('roomCode');
      console.error('Error joining room:', error);
    }
  }
}

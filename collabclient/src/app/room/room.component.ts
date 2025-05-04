import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { QueueComponent } from "../queue/queue.component";

interface RoomResponse {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  hostId: string;
  members?: any[];
  songs?: any[];
  // Add more fields as needed
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HttpClientModule, QueueComponent],
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent implements OnInit {
  loading = true;
  roomCode: string = '';
  userName: string = '';
  userId: string = '';
  room: RoomResponse | null = null;
  error: string = '';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const userDetails = localStorage.getItem('user_details');
    this.userId = userDetails ? JSON.parse(userDetails).id : '';
    this.userName = userDetails ? JSON.parse(userDetails).name : 'Guest';

    const existingRoomCode = localStorage.getItem('roomCode');
    if (existingRoomCode) {
      this.roomCode = existingRoomCode;
      this.joinExistingRoom(existingRoomCode);
    } else {
      this.roomCode = this.generateRoomCode();
      this.createRoom();
    }
  }

  joinExistingRoom(code: string): void {
    this.http.get<RoomResponse>(`http://localhost:3000/room/code/${code}`)
      .subscribe({
        next: async (room) => {
          this.room = room;
          // Join as a member
          await this.http.post(`http://localhost:3000/room/${room.id}/join`, {
            userId: this.userId,
            isGuest: false
          }).toPromise();

          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to join room. Please check the room code.';
          this.loading = false;
          console.error('Error joining room:', error);
        }
      });
  }

  generateRoomCode(): string {
    // Generate a random 4-digit code
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  createRoom(): void {
    const payload = {
      code: this.roomCode,
      name: this.userName,
      isActive: true,
      hostId: this.userId
    };

    this.http.post<RoomResponse>('http://localhost:3000/room', payload)
      .subscribe({
        next: (response) => {
          this.room = response;
          this.loading = false;
          // Store room code in localStorage
          localStorage.setItem('roomCode', this.roomCode);
          console.log('Room created successfully:', response);
        },
        error: (error) => {
          this.error = 'Failed to create room. Please try again.';
          this.loading = false;
          console.error('Error creating room:', error);
        }
      });
  }
}

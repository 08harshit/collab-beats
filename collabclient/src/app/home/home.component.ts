import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';
import { UserDetails } from '../interfaces/user.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  isSpotifyConnected = false;
  userDetails: UserDetails | null = null;
  private authSubscription: Subscription;
  roomCode: string = '';
  error: string = '';

  constructor(
    private router: Router,
    private readonly httpClient: HttpClient,
    private authService: AuthService
  ) {
    this.authSubscription = this.authService.authState$.subscribe(
      (isAuthenticated) => {
        if (isAuthenticated) {
          this.checkUserStatus();
        }
      }
    );
  }

  ngOnInit() {
    this.checkUserStatus();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  checkUserStatus() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      this.isSpotifyConnected = false;
      return;
    }

    this.httpClient.get<{status: string; user: UserDetails}>('http://localhost:3000/users/get-user-status', {
      params: { id: Number(userId) }
    }).subscribe({
      next: (response) => {
        this.isSpotifyConnected = response.status === 'valid';
        this.userDetails = response.user;
        if (this.isSpotifyConnected) {
          localStorage.setItem('user_details', JSON.stringify(response.user));
        } else {
          this.clearUserData();
        }
      },
      error: (error) => {
        console.error('Error fetching user status:', error);
        this.isSpotifyConnected = false;
        this.clearUserData();
      }
    });
  }

  private clearUserData() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('user_details');
    this.userDetails = null;
  }

  connectToSpotify() {
    this.router.navigate(['/connect-spotify']);
  }

  disconnectSpotify() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_details');
    this.isSpotifyConnected = false;
    this.userDetails = null;
  }

  createRoom() {
    this.router.navigate(['/room']);
  }

  joinRoom() {
    if (!this.isValidRoomCode()) {
      this.error = 'Please enter a valid 4-digit room code';
      return;
    }

    this.httpClient.get<any>(`http://localhost:3000/room/code/${this.roomCode}`)
      .subscribe({
        next: (room) => {
          localStorage.setItem('roomCode', this.roomCode);
          this.router.navigate(['/room']);
        },
        error: (error) => {
          this.error = 'Room not found. Please check the code and try again.';
        }
      });
  }

  isValidRoomCode(): boolean {
    return /^\d{4}$/.test(this.roomCode);
  }
}

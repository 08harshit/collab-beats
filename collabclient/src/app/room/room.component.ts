import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { QueueComponent } from "../queue/queue.component";
import { SearchComponent } from './search/search.component';
import { Router } from '@angular/router';
import { RoomService } from '../services/room.service';
import { SocketService } from '../services/socket.service';
import { SpotifyService, PlaybackState, SpotifyTrack } from '../services/spotify.service';
import type { RoomResponse } from '../services/room.service';
import { firstValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, HttpClientModule, QueueComponent, SearchComponent],
  templateUrl: './room.component.html',
})
export class RoomComponent implements OnInit, OnDestroy {
  loading = true;
  roomCode: string | null = null;
  userName: string | null = null;
  userId: number = 0;
  room: RoomResponse | null = null;
  songs: any[] = []; // Manage songs separately for better control
  error: string | null = '';
  private subscriptions: Subscription[] = [];

  // Spotify player state
  playbackState: PlaybackState = {
    is_playing: false,
    progress_ms: 0,
    track: null,
    device_id: null,
    position: 0,
    duration: 0
  };

  playerReady = false;
  deviceReady = false;
  spotifyInitialized = false;
  accessToken: string | null = null;
  isUsingSpotifyConnect = false;
  availableDevices: any[] = [];
  selectedDevice: any = null;
  useConnectMode = false;
  supportedCountries: string[] = [];

  // Progress bar update interval
  private progressInterval: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private roomService: RoomService,
    private socketService: SocketService,
    private spotifyService: SpotifyService
  ) {}

  async ngOnInit(): Promise<void> {
    // Get user details from backend to ensure we have the database user ID
    await this.loadUserDetails();
    this.accessToken = localStorage.getItem('spotify_access_token');

    if (!this.userId) {
      this.error = 'User not logged in';
      this.loading = false;
      return;
    }

    // Initialize Spotify player automatically if we have an access token
    if (this.accessToken) {
      this.initializeSpotifyPlayer();
    } else {
      this.error = 'Please log in to Spotify to use the music player';
      // Still allow room functionality, just no music playback
    }

    const existingRoomCode = localStorage.getItem('roomCode');
    if (existingRoomCode) {
      this.roomCode = existingRoomCode;
      this.joinExistingRoom(existingRoomCode);
    } else {
      this.loading = false;
    }

    this.setupSocketSubscriptions();
    this.setupSpotifySubscriptions();

    // Check current playback mode
    this.useConnectMode = localStorage.getItem('use_connect_mode') === 'true';
    this.supportedCountries = this.spotifyService.getSupportedCountries();
  }

  private async loadUserDetails(): Promise<void> {
    const spotifyUserId = localStorage.getItem('user_id');
    const accessToken = localStorage.getItem('spotify_access_token');

    if (!spotifyUserId || !accessToken) {
      console.log('No user ID or access token found');
      return;
    }

    try {
      const response = await this.http.get<{status: string; user: any}>(`http://localhost:3000/api/users/get-user-status`, {
        params: { id: spotifyUserId }
      }).toPromise();

      if (response && response.user) {
        this.userId = response.user.id;  // Use database ID
        this.userName = response.user.name || 'Guest';
        console.log('Loaded user details:', response.user);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  }

  async initializeSpotifyPlayer() {
    const token = localStorage.getItem('spotify_access_token');
    if (!token) {
      console.log('No Spotify access token found');
      return;
    }

    this.accessToken = token;

    try {
      await this.spotifyService.initializePlayer(token);
      this.spotifyInitialized = true;
      this.isUsingSpotifyConnect = this.spotifyService.isUsingSpotifyConnect();

      if (this.isUsingSpotifyConnect) {
        // In Connect mode, get available devices
        this.availableDevices = this.spotifyService.getAvailableDevices();
        console.log('🔗 Using Spotify Connect mode with devices:', this.availableDevices);
      }

      console.log('✅ Spotify player initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spotify player:', error);
      this.error = this.getSpotifyErrorMessage(error);
    }
  }

  private getSpotifyErrorMessage(error: any): string {
    const errorMsg = error?.message || error?.toString() || 'Unknown error';

    if (errorMsg.includes('Premium required')) {
      return 'Spotify Premium subscription required for music playback';
    } else if (errorMsg.includes('token')) {
      return 'Spotify authentication expired. Please reconnect your account';
    } else if (errorMsg.includes('not available')) {
      return 'Music player not available in your region. Using device control mode';
    } else {
      return 'Unable to connect to Spotify. Please check your connection and try again';
    }
  }

  private setupSocketSubscriptions(): void {
    console.log('[Room] Setting up socket event subscriptions');
    this.subscriptions.push(
      this.socketService.onRoomUpdate().subscribe((update) => {
        console.log('[Room] Socket event received:', update);
        if (update.type === 'userJoined' || update.type === 'userLeft') {
          console.log('[Room] User joined/left event, updating room data');
          this.room = update.room;
        } else if (update.type === 'songAdded') {
          console.log('[Room] Song added by another user, updating songs');
          this.songs = update.room?.songs || [];
        } else if (update.type === 'voteUpdated') {
          console.log('[Room] Vote updated, refreshing room data');
          this.refreshRoomData();
        }
      }),
      this.socketService.onPlaybackControl().subscribe((data) => {
        console.log('[Room] Playback control event received:', data);
        this.handleRemotePlaybackControl(data);
      }),
      this.socketService.onError().subscribe((error) => {
        console.error('[Room] Socket error received:', error);
        this.error = error.message;
      })
    );
  }

  private setupSpotifySubscriptions(): void {
    this.subscriptions.push(
      this.spotifyService.getPlaybackState().subscribe((state) => {
        this.playbackState = state;
        this.updateProgressBar();

        // Broadcast playback state to other room members
        if (this.room?.id && this.spotifyInitialized) {
          this.socketService.emit('playbackStateUpdate', {
            roomId: this.room.id,
            userId: this.userId,
            playbackState: state
          });
        }
      }),

      this.spotifyService.getPlayerReady().subscribe((ready) => {
        this.playerReady = ready;
        if (ready) {
          console.log('Spotify player is ready');
        }
      }),

      this.spotifyService.getDeviceReady().subscribe((ready) => {
        this.deviceReady = ready;
        if (ready) {
          console.log('Spotify device is ready');
          // Optionally transfer playback to this device
          // this.spotifyService.transferPlayback();
        }
      })
    );
  }

  private handleRemotePlaybackControl(data: any): void {
    if (data.userId === this.userId) {
      return; // Don't handle our own events
    }

    console.log('[Room] Handling remote playback control:', data);

    switch (data.action) {
      case 'play':
        if (data.uris) {
          console.log('[Room] Playing specific tracks from remote:', data.uris);
          this.spotifyService.play(data.uris);
        } else {
          console.log('[Room] Resuming playback from remote');
          this.spotifyService.play();
        }
        break;
      case 'pause':
        console.log('[Room] Pausing playback from remote');
        this.spotifyService.pause();
        break;
      case 'next':
        console.log('[Room] Next track from remote');
        this.spotifyService.nextTrack();
        break;
      case 'previous':
        console.log('[Room] Previous track from remote');
        this.spotifyService.previousTrack();
        break;
      case 'seek':
        console.log('[Room] Seeking from remote to:', data.position);
        this.spotifyService.seek(data.position);
        break;
    }
  }

  private updateProgressBar(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    if (this.playbackState.is_playing) {
      this.progressInterval = setInterval(() => {
        this.playbackState.progress_ms += 1000;
        if (this.playbackState.progress_ms >= this.playbackState.duration) {
          this.playbackState.progress_ms = this.playbackState.duration;
          clearInterval(this.progressInterval);
        }
      }, 1000);
    }
  }

  async joinExistingRoom(code: string): Promise<void> {
    try {
      console.log(`[Room] Attempting to join room with code: ${code}`);
      const room = await firstValueFrom(this.roomService.getRoomByCode(code));
      if (room?.id) {
        this.room = room;
        this.songs = this.processSongsWithVotes(room.songs || []);
        this.roomCode = room.code;
        await firstValueFrom(this.roomService.joinRoom(room.id, this.userId));

        this.socketService.joinRoom(room.id, this.userId.toString());
        this.loading = false;
      } else {
        throw new Error('Room not found');
      }
    } catch (error) {
      this.error = 'Failed to join room. Please check the room code.';
      this.loading = false;
      this.roomCode = '';
      localStorage.removeItem('roomCode');
      console.error('[Room] Error joining room:', error);
    }
  }

  /**
   * Handles song addition events from the search component
   */
  onSongAdded(updatedRoom: any): void {
    if (updatedRoom?.songs) {
      this.songs = this.processSongsWithVotes(updatedRoom.songs);
    }
  }

  /**
   * Handles song updates from the queue component (e.g., after voting)
   */
  onSongsUpdated(updatedSongs: any[]): void {
    this.songs = updatedSongs;
  }

    /**
   * Processes songs with vote information, preserving backend-calculated values when available.
   * Sorts songs by vote count (descending), then by time added (ascending).
   */
  private processSongsWithVotes(songs: any[]): any[] {
    const processedSongs = songs.map(song => {
      const votes = song.votes || [];

      // Preserve backend-calculated values, only recalculate if not provided
      const voteCount = this.getVoteCount(song, votes);
      const userVote = this.getUserVote(song, votes);

      return { ...song, voteCount, userVote };
    });

    return this.sortSongsByVotes(processedSongs);
  }

  /**
   * Gets the vote count for a song, preferring backend value over client calculation
   */
  private getVoteCount(song: any, votes: any[]): number {
    if (typeof song.voteCount === 'number') {
      return song.voteCount;
    }
    return votes.reduce((sum: number, vote: any) => sum + (vote.voteValue || 0), 0);
  }

  /**
   * Gets the user's vote for a song, preferring backend value over client calculation
   */
  private getUserVote(song: any, votes: any[]): number | null {
    if (song.userVote !== undefined && song.userVote !== null) {
      return song.userVote;
    }
    const userVoteData = votes.find((vote: any) => vote.userId === this.userId);
    return userVoteData?.voteValue || null;
  }

  /**
   * Sorts songs by vote count (descending), then by time added (ascending)
   */
  private sortSongsByVotes(songs: any[]): any[] {
    return songs.sort((a, b) => {
      const voteCountDiff = (b.voteCount || 0) - (a.voteCount || 0);
      if (voteCountDiff !== 0) return voteCountDiff;

      // If votes are equal, sort by time added (older first)
      const dateA = new Date(a.addedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.addedAt || b.createdAt || 0).getTime();
      return dateA - dateB;
    });
  }

  private async refreshRoomData(): Promise<void> {
    if (this.room?.id) {
      try {
        const updatedRoom = await firstValueFrom(this.roomService.getRoomDetails(this.room.id));
        if (updatedRoom) {
          this.room = updatedRoom;
          this.songs = this.processSongsWithVotes(updatedRoom.songs || []);
        }
      } catch (error) {
        console.error('[Room] Error refreshing room data:', error);
      }
    }
  }

  async onPlaySongFromQueue(spotifyId: string): Promise<void> {
    if (!this.spotifyInitialized) {
      console.warn('[Room] Spotify not initialized, cannot play song');
      this.error = 'Spotify player not ready. Please wait a moment and try again.';
      return;
    }

    try {
      console.log('[Room] Playing song from queue:', spotifyId);

      // Convert Spotify ID to URI format
      const spotifyUri = `spotify:track:${spotifyId}`;

      // Play the specific track
      await this.spotifyService.play([spotifyUri]);

      // Broadcast to other room members that this song was played
      this.broadcastPlaybackControl({
        action: 'play',
        uris: [spotifyUri],
        spotifyId: spotifyId
      });

      console.log('[Room] Successfully started playing song:', spotifyId);

      // Clear any previous errors
      this.error = '';
    } catch (error: any) {
      console.error('[Room] Error playing song from queue:', error);

      // Show user-friendly error messages
      if (error.message) {
        this.error = error.message;
      } else if (error.status === 404) {
        this.error = 'No active Spotify device found. Please start Spotify on another device or switch to Web Player mode.';
      } else if (error.status === 403) {
        this.error = 'Spotify Premium required for playback control.';
      } else {
        this.error = 'Failed to play song. Please try again.';
      }

      // Clear error after 5 seconds
      setTimeout(() => {
        this.error = '';
      }, 5000);
    }
  }

  // Playback control methods
  async playPause(): Promise<void> {
    if (!this.spotifyInitialized) return;

    await this.spotifyService.togglePlay();

    // Broadcast to other room members
    this.broadcastPlaybackControl({
      action: this.playbackState.is_playing ? 'pause' : 'play'
    });
  }

  async nextTrack(): Promise<void> {
    if (!this.spotifyInitialized) return;

    await this.spotifyService.nextTrack();
    this.broadcastPlaybackControl({ action: 'next' });
  }

  async previousTrack(): Promise<void> {
    if (!this.spotifyInitialized) return;

    await this.spotifyService.previousTrack();
    this.broadcastPlaybackControl({ action: 'previous' });
  }

  async seek(event: any): Promise<void> {
    if (!this.spotifyInitialized) return;

    const progressBar = event.target;
    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const position = Math.floor(percent * this.playbackState.duration);

    await this.spotifyService.seek(position);
    this.broadcastPlaybackControl({
      action: 'seek',
      position: position
    });
  }

  private broadcastPlaybackControl(data: any): void {
    if (this.room?.id) {
      this.socketService.emit('playbackControl', {
        roomId: this.room.id,
        userId: this.userId,
        data: data
      });
    }
  }

  // Helper methods for template
  get currentSong(): any {
    if (this.playbackState.track) {
      return {
        title: this.playbackState.track.name,
        artist: this.playbackState.track.artists[0]?.name || 'Unknown Artist',
        cover: this.playbackState.track.album.images[0]?.url || 'assets/default-album.png',
        progress: this.playbackState.duration > 0
          ? (this.playbackState.progress_ms / this.playbackState.duration) * 100
          : 0
      };
    }

    return {
      title: 'No song playing',
      artist: 'Connect to Spotify and start playing',
      cover: 'assets/default-album.png',
      progress: 0
    };
  }

  get isPlaying(): boolean {
    return this.playbackState.is_playing;
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async selectSpotifyDevice(device: any) {
    try {
      await this.spotifyService.selectDevice(device.id);
      this.selectedDevice = device;
      console.log('Selected Spotify device:', device.name);
    } catch (error) {
      console.error('Error selecting device:', error);
    }
  }

  async refreshDevices() {
    if (this.isUsingSpotifyConnect) {
      // Refresh available devices
      await this.spotifyService['refreshAvailableDevices']();
      this.availableDevices = this.spotifyService.getAvailableDevices();
    }
  }

  handleImageError(event: any) {
    // Set fallback image for broken album covers
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHZpZXdCb3g9IjAgMCA1NiA1NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjNDA0MDQwIi8+CjxwYXRoIGQ9Ik0yOCAzNkMzMi40MTgzIDM2IDM2IDMyLjQxODMgMzYgMjhDMzYgMjMuNTgxNyAzMi40MTgzIDIwIDI4IDIwQzIzLjU4MTcgMjAgMjAgMjMuNTgxNyAyMCAyOEMyMCAzMi40MTgzIDIzLjU4MTcgMzYgMjggMzZaIiBmaWxsPSIjMUVENzYwIi8+CjxwYXRoIGQ9Ik0yOCAzMkMzMC4yMDkxIDMyIDMyIDMwLjIwOTEgMzIgMjhDMzIgMjUuNzkwOSAzMC4yMDkxIDI0IDI4IDI0QzI1Ljc5MDkgMjQgMjQgMjUuNzkwOSAyNCAyOEMyNCAzMC4yMDkxIDI1Ljc5MDkgMzIgMjggMzJaIiBmaWxsPSIjMTIxMjEyIi8+Cjwvc3ZnPgo=';
  }

    async togglePlaybackMode() {
    this.useConnectMode = !this.useConnectMode;
    localStorage.setItem('use_connect_mode', this.useConnectMode.toString());

    if (this.useConnectMode) {
      console.log('🔗 Switched to Connect mode');
      alert('Connect Mode Enabled!\n\nThis will control your existing Spotify devices instead of playing directly in the browser.\n\nRefresh the page to apply changes.');
    } else {
      console.log('🎵 Switched to Web Playback mode');
      alert('Web Playback Mode Enabled!\n\nThis will play music directly in your browser.\n\nIf you\'re in an unsupported region, make sure you\'re connected to VPN.\n\nRefresh the page to apply changes.');
    }
  }

  ngOnDestroy() {
    // Clear progress interval
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    // Leave socket room
    if (this.room?.id) {
      this.socketService.leaveRoom(this.room.id, this.userId.toString());
    }

    // Unsubscribe from all events
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Disconnect Spotify player
    this.spotifyService.disconnect();
  }
}

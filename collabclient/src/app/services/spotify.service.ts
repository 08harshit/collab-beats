import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { map, switchMap, filter, finalize, mergeMap, tap } from 'rxjs/operators';

// TypeScript interfaces for Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: any) => any;
    };
  }
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  uri: string;
}

export interface PlaybackState {
  is_playing: boolean;
  progress_ms: number;
  track: SpotifyTrack | null;
  device_id: string | null;
  position: number;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private player: any = null;
  private deviceId: string | null = null;
  private accessToken: string | null = null;
  private sdkReady = false;
  private isUnsupportedRegion = false;
  private availableDevices: any[] = [];
  private selectedDeviceId: string | null = null;

  // Observables for state management
  private playbackState$ = new BehaviorSubject<PlaybackState>({
    is_playing: false,
    progress_ms: 0,
    track: null,
    device_id: null,
    position: 0,
    duration: 0
  });

  private playerReady$ = new BehaviorSubject<boolean>(false);
  private deviceReady$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadSpotifySDK();
  }

  // Load Spotify Web Playback SDK
  private loadSpotifySDK(): void {
    if (document.getElementById('spotify-sdk')) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.id = 'spotify-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      this.sdkReady = true;
      console.log('Spotify Web Playback SDK is ready');
    };
  }

  // Initialize the Spotify player
    async initializePlayer(accessToken: string, playerName: string = 'CollabBeats Player'): Promise<void> {
    this.accessToken = accessToken;

    try {
      // First validate token and premium status
      await this.validateTokenAndPremium();

      // Check if we should use Web Playback SDK (default for VPN users)
      const shouldUseWebPlayback = this.shouldUseWebPlayback();

      if (shouldUseWebPlayback) {
        console.log('🎵 Using Spotify Web Playback SDK');
        await this.initializeWebPlayback(playerName);
      } else {
        console.log('🌍 Using Spotify Connect mode');
        await this.initializeSpotifyConnect();
      }

    } catch (error) {
      console.error('Failed to initialize Spotify player:', error);

      // If Web Playback fails, show VPN instructions
      if ((error as any)?.message?.includes('Web Playback SDK')) {
        console.log('💡 If you\'re using VPN, make sure it\'s connected to a supported country');
        console.log('💡 Supported countries:', this.getSupportedCountries().join(', '));
      }

      throw error;
    }
  }

    private shouldUseWebPlayback(): boolean {
    // Default to Web Playback SDK (assuming VPN usage)
    // Only use Connect mode if explicitly disabled
    const useConnectMode = localStorage.getItem('use_connect_mode') === 'true';

    if (useConnectMode) {
      console.log('🔗 Connect mode enabled by user preference');
      return false;
    }

    // Always try Web Playback first, even in unsupported regions (VPN assumption)
    console.log('🎵 Attempting Web Playback SDK (VPN assumed if in unsupported region)');
    return true;
  }

  private async initializeSpotifyConnect(): Promise<void> {
    console.log('🔗 Initializing Spotify Connect mode...');

    // Get available devices
    await this.refreshAvailableDevices();

    // Start polling for playback state
    this.startPlaybackStatePolling();

    // Mark as ready (using Connect mode)
    this.playerReady$.next(true);
    this.deviceReady$.next(true);

    console.log('✅ Spotify Connect mode initialized');
  }

  private async initializeWebPlayback(playerName: string): Promise<void> {
    console.log('🎵 Initializing Web Playback SDK...');

    // Load SDK and initialize player (original logic)
    this.loadSpotifySDK();
    await this.waitForSDK();

    this.player = new window.Spotify.Player({
      name: playerName,
      getOAuthToken: (cb: (token: string) => void) => {
        cb(this.accessToken!);
      },
      volume: 0.5
    });

    this.setupPlayerEventListeners();
    await this.player.connect();

    console.log('✅ Web Playback SDK initialized');
  }

  private async validateTokenAndPremium(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    if (this.isTokenExpired()) {
      throw new Error('Access token has expired');
    }

    try {
      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${this.accessToken}`);

      // Check user profile and premium status
      const userProfile: any = await this.http.get('https://api.spotify.com/v1/me', { headers }).toPromise();

      console.log('User profile:', {
        id: userProfile.id,
        product: userProfile.product,
        country: userProfile.country,
        display_name: userProfile.display_name
      });

      if (userProfile.product !== 'premium') {
        throw new Error(`Spotify Premium required. Current plan: ${userProfile.product}`);
      }

            // Check Web Playback SDK availability in user's market
      if (userProfile.country && !this.isWebPlaybackSupportedInCountry(userProfile.country)) {
        console.warn(`⚠️ Web Playback SDK officially not available in ${userProfile.country}`);
        console.log('💡 If you\'re using VPN, the Web Playback SDK should still work');
        console.log('💡 If you experience issues, make sure your VPN is connected to:', this.getSupportedCountries().slice(0, 10).join(', '), '...');

        // Mark as unsupported region but still try Web Playback (for VPN users)
        this.isUnsupportedRegion = true;
      }

      console.log('✅ Token and Premium validation successful');
    } catch (error) {
      console.error('❌ Token/Premium validation failed:', error);
      throw error;
    }
  }

  // Check if token is expired
  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('spotify_token_expires_at');
    if (!expiresAt) return true;

    const now = Date.now();
    const expiry = parseInt(expiresAt);
    const isExpired = now >= expiry;

    if (isExpired) {
      console.warn('Spotify token is expired');
    }

    return isExpired;
  }

  // Check Web Playback SDK country support
  private isWebPlaybackSupportedInCountry(country: string): boolean {
    // List of countries where Web Playback SDK is supported
    const supportedCountries = [
      'AD', 'AR', 'AT', 'AU', 'BE', 'BG', 'BO', 'BR', 'CA', 'CH', 'CL', 'CO', 'CR', 'CY', 'CZ', 'DE', 'DK', 'DO', 'EC', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'GT', 'HK', 'HN', 'HU', 'ID', 'IE', 'IS', 'IT', 'JP', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'MX', 'MY', 'NI', 'NL', 'NO', 'NZ', 'PA', 'PE', 'PH', 'PL', 'PT', 'PY', 'SE', 'SG', 'SK', 'SV', 'TH', 'TR', 'TW', 'US', 'UY', 'VN'
    ];
    return supportedCountries.includes(country);
  }

  private waitForSDK(): Promise<void> {
    return new Promise((resolve) => {
      const checkSDK = () => {
        if (this.sdkReady && window.Spotify) {
          resolve();
        } else {
          setTimeout(checkSDK, 100);
        }
      };
      checkSDK();
    });
  }

  private setupPlayerEventListeners(): void {
    // Ready event - player is ready to stream
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      this.deviceId = device_id;
      this.deviceReady$.next(true);
    });

    // Not ready event - player went offline
    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
      this.deviceReady$.next(false);
    });

    // Player state changed
    this.player.addListener('player_state_changed', (state: any) => {
      if (!state) {
        return;
      }

      const track = state.track_window.current_track;
      const playbackState: PlaybackState = {
        is_playing: !state.paused,
        progress_ms: state.position,
        track: track ? {
          id: track.id,
          name: track.name,
          artists: track.artists,
          album: track.album,
          duration_ms: track.duration_ms,
          uri: track.uri
        } : null,
        device_id: this.deviceId,
        position: state.position,
        duration: track ? track.duration_ms : 0
      };

      this.playbackState$.next(playbackState);
    });

    // Error listeners
    this.player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Spotify initialization error:', message);
    });

    this.player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Spotify authentication error:', message);
    });

    this.player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Spotify account error:', message);
    });

    this.player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Spotify playback error:', message);
    });
  }

  // OAuth token exchange
  exchangeToken(code: string) {
    const body = new URLSearchParams({
      code: code,
      redirect_uri: environment.spotify.redirectUri,
      grant_type: 'authorization_code'
    });

    const headers = new HttpHeaders()
      .set('content-type', 'application/x-www-form-urlencoded')
      .set('Authorization', 'Basic ' + btoa(`${environment.spotify.clientId}:${environment.spotify.clientSecret}`));

    return this.http.post('https://accounts.spotify.com/api/token',
      body.toString(),
      { headers }
    );
  }

  // Playback control methods
  async play(uris?: string[]): Promise<void> {
    if (this.isUnsupportedRegion) {
      await this.playWithConnect(uris);
    } else if (this.player) {
      if (uris && uris.length > 0) {
        await this.startPlayback(uris);
      } else {
        await this.player.resume();
      }
    }
  }

  async pause(): Promise<void> {
    if (this.isUnsupportedRegion) {
      await this.pauseWithConnect();
    } else if (this.player) {
      await this.player.pause();
    }
  }

  async togglePlay(): Promise<void> {
    if (this.isUnsupportedRegion) {
      const currentState = await this.getCurrentPlaybackState();
      if (currentState?.is_playing) {
        await this.pauseWithConnect();
      } else {
        await this.playWithConnect();
      }
    } else if (this.player) {
      await this.player.togglePlay();
    }
  }

  async nextTrack(): Promise<void> {
    if (this.isUnsupportedRegion) {
      await this.nextTrackWithConnect();
    } else if (this.player) {
      await this.player.nextTrack();
    }
  }

  async previousTrack(): Promise<void> {
    if (this.isUnsupportedRegion) {
      await this.previousTrackWithConnect();
    } else if (this.player) {
      await this.player.previousTrack();
    }
  }

  async seek(position_ms: number): Promise<void> {
    if (this.isUnsupportedRegion) {
      await this.seekWithConnect(position_ms);
    } else if (this.player) {
      await this.player.seek(position_ms);
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.isUnsupportedRegion) {
      await this.setVolumeWithConnect(volume);
    } else if (this.player) {
      await this.player.setVolume(volume);
    }
  }

  // Start playback with specific tracks
  private async startPlayback(uris: string[]): Promise<void> {
    if (!this.accessToken || !this.deviceId) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json');

    const body = {
      uris: uris,
      device_id: this.deviceId
    };

    try {
      await this.http.put('https://api.spotify.com/v1/me/player/play', body, { headers }).toPromise();
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  }

  // Transfer playback to this device
  async transferPlayback(): Promise<void> {
    if (!this.accessToken || !this.deviceId) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json');

    const body = {
      device_ids: [this.deviceId],
      play: false
    };

    try {
      await this.http.put('https://api.spotify.com/v1/me/player', body, { headers }).toPromise();
    } catch (error) {
      console.error('Error transferring playback:', error);
    }
  }

  // Search for tracks
  searchTracks(query: string, limit: number = 20): Observable<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);

    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString()
    });

    return this.http.get(`https://api.spotify.com/v1/search?${params.toString()}`, { headers });
  }

  // Add track to queue
  async addToQueue(uri: string): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json');

    try {
      await this.http.post(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`, {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  }

  // Getters for observables
  getPlaybackState(): Observable<PlaybackState> {
    return this.playbackState$.asObservable();
  }

  getPlayerReady(): Observable<boolean> {
    return this.playerReady$.asObservable();
  }

  getDeviceReady(): Observable<boolean> {
    return this.deviceReady$.asObservable();
  }

  // Get current state
  async getCurrentState(): Promise<any> {
    if (!this.player) return null;
    return await this.player.getCurrentState();
  }

  // Cleanup
  disconnect(): void {
    if (this.player) {
      this.player.disconnect();
      this.player = null;
      this.deviceId = null;
      this.playerReady$.next(false);
      this.deviceReady$.next(false);
    }
  }

  // Get device ID
  getDeviceId(): string | null {
    return this.deviceId;
  }

  // Set access token
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private async refreshAvailableDevices(): Promise<void> {
    if (!this.accessToken) return;

    try {
      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${this.accessToken}`);

      const response: any = await this.http.get('https://api.spotify.com/v1/me/player/devices', { headers }).toPromise();
      this.availableDevices = response.devices || [];

      console.log('Available Spotify devices:', this.availableDevices);

      // If we have our Web Playback device, add it to the list if not already there
      if (this.deviceId && !this.availableDevices.find(d => d.id === this.deviceId)) {
        this.availableDevices.push({
          id: this.deviceId,
          name: 'CollabBeats Web Player',
          type: 'Computer',
          is_active: true, // Our web player should be considered active
          is_private_session: false,
          is_restricted: false,
          volume_percent: 50
        });
        console.log('[Spotify] Added Web Playback device to available devices');
      }

      // Auto-select the first active device or the first device if none are active
      const activeDevice = this.availableDevices.find(d => d.is_active);
      if (activeDevice && !this.selectedDeviceId) {
        this.selectedDeviceId = activeDevice.id;
        console.log('[Spotify] Auto-selected active device:', activeDevice.name);
      } else if (this.availableDevices.length > 0 && !this.selectedDeviceId) {
        this.selectedDeviceId = this.availableDevices[0].id;
        console.log('[Spotify] Auto-selected first device:', this.availableDevices[0].name);
      }

    } catch (error: any) {
      console.error('Error fetching devices:', error);
      this.availableDevices = [];

      // If we have our Web Playback device, at least include it
      if (this.deviceId) {
        this.availableDevices = [{
          id: this.deviceId,
          name: 'CollabBeats Web Player',
          type: 'Computer',
          is_active: true,
          is_private_session: false,
          is_restricted: false,
          volume_percent: 50
        }];
        console.log('[Spotify] Using Web Playback device as fallback');

        if (!this.selectedDeviceId) {
          this.selectedDeviceId = this.deviceId;
        }
      }
    }
  }

  private startPlaybackStatePolling(): void {
    // Poll for current playback state every 1 second in Connect mode
    interval(1000).pipe(
      switchMap(() => this.getCurrentPlaybackState()),
      filter(state => state !== null)
    ).subscribe(state => {
      if (state) {
        const playbackState: PlaybackState = {
          is_playing: state.is_playing,
          progress_ms: state.progress_ms,
          track: state.item ? {
            id: state.item.id,
            name: state.item.name,
            artists: state.item.artists,
            album: state.item.album,
            duration_ms: state.item.duration_ms,
            uri: state.item.uri
          } : null,
          device_id: state.device?.id || null,
          position: state.progress_ms,
          duration: state.item?.duration_ms || 0
        };

        this.playbackState$.next(playbackState);
      }
    });
  }

  private async getCurrentPlaybackState(): Promise<any> {
    if (!this.accessToken) return null;

    try {
      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${this.accessToken}`);

      return await this.http.get('https://api.spotify.com/v1/me/player', { headers }).toPromise();
    } catch (error) {
      // Silently handle errors (user might not be playing anything)
      return null;
    }
  }

  // Spotify Connect API methods
  private async playWithConnect(uris?: string[]): Promise<void> {
    if (!this.accessToken) return;

    // First, ensure we have available devices
    await this.refreshAvailableDevices();

    // If we have a Web Playback device and it's ready, use it directly
    if (this.deviceId && this.player && !this.isUnsupportedRegion) {
      console.log('[Spotify] Using Web Playback device for playback');
      return this.startPlayback(uris || []);
    }

    // For Connect mode, ensure we have an active device
    if (this.availableDevices.length === 0) {
      throw new Error('No Spotify devices available. Please open Spotify on another device.');
    }

    // If no device is selected, try to find an active one or use the first available
    if (!this.selectedDeviceId) {
      const activeDevice = this.availableDevices.find(device => device.is_active);
      const targetDevice = activeDevice || this.availableDevices[0];

      if (targetDevice) {
        console.log('[Spotify] Auto-selecting device:', targetDevice.name);
        await this.selectDevice(targetDevice.id);
      }
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json');

    const body: any = {};

    if (uris && uris.length > 0) {
      body.uris = uris;
    }

    // Always specify device_id for Connect API
    if (this.selectedDeviceId) {
      body.device_id = this.selectedDeviceId;
    } else if (this.deviceId) {
      // Fallback to Web Playback device if available
      body.device_id = this.deviceId;
    }

    try {
      await this.http.put('https://api.spotify.com/v1/me/player/play', body, { headers }).toPromise();
      console.log('[Spotify] Successfully started playback with Connect API');
    } catch (error: any) {
      console.error('Error starting playback with Connect:', error);

      if (error.status === 404) {
        // Try to transfer playback to our device first
        if (this.deviceId && this.player) {
          console.log('[Spotify] 404 error, trying to transfer to Web Playback device');
          await this.transferPlaybackToDevice(this.deviceId);

          // Wait a moment then try again
          setTimeout(() => {
            this.startPlayback(uris || []);
          }, 1000);
        } else {
          throw new Error('No active Spotify device found. Please start playing music on Spotify first, or switch to Web Player mode.');
        }
      } else {
        throw error;
      }
    }
  }

  private async pauseWithConnect(): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);

    try {
      await this.http.put('https://api.spotify.com/v1/me/player/pause', {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error pausing playback with Connect:', error);
    }
  }

  private async nextTrackWithConnect(): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);

    try {
      await this.http.post('https://api.spotify.com/v1/me/player/next', {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error skipping to next track with Connect:', error);
    }
  }

  private async previousTrackWithConnect(): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);

    try {
      await this.http.post('https://api.spotify.com/v1/me/player/previous', {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error skipping to previous track with Connect:', error);
    }
  }

  private async seekWithConnect(position_ms: number): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);

    try {
      await this.http.put(`https://api.spotify.com/v1/me/player/seek?position_ms=${position_ms}`, {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error seeking with Connect:', error);
    }
  }

  private async setVolumeWithConnect(volume: number): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);

    const volumePercent = Math.round(volume * 100);

    try {
      await this.http.put(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {}, { headers }).toPromise();
    } catch (error) {
      console.error('Error setting volume with Connect:', error);
    }
  }

  // Helper methods
  getAvailableDevices(): any[] {
    return this.availableDevices;
  }

  async selectDevice(deviceId: string): Promise<void> {
    this.selectedDeviceId = deviceId;
    console.log('[Spotify] Selected device ID:', deviceId);

    // Transfer playback to selected device
    try {
      await this.transferPlaybackToDevice(deviceId);
    } catch (error) {
      console.error('[Spotify] Error transferring playback to device:', error);
    }
  }

  private async transferPlaybackToDevice(deviceId: string): Promise<void> {
    if (!this.accessToken) return;

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`)
      .set('Content-Type', 'application/json');

    const body = {
      device_ids: [deviceId],
      play: false
    };

    try {
      console.log('[Spotify] Transferring playback to device:', deviceId);
      await this.http.put('https://api.spotify.com/v1/me/player', body, { headers }).toPromise();
      console.log('[Spotify] Successfully transferred playback');

      // Give Spotify a moment to process the transfer
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error('Error transferring playback:', error);

      if (error.status === 404) {
        console.log('[Spotify] No active session found, device transfer may not be needed');
      } else {
        throw error;
      }
    }
  }

  isUsingSpotifyConnect(): boolean {
    return this.isUnsupportedRegion;
  }

    // Helper methods for mode management
  setConnectMode(enabled: boolean): void {
    localStorage.setItem('use_connect_mode', enabled.toString());
    console.log(`Connect mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  isConnectModeEnabled(): boolean {
    return localStorage.getItem('use_connect_mode') === 'true';
  }

  // Get list of supported countries for user reference
  getSupportedCountries(): string[] {
    return [
      'AD', 'AR', 'AT', 'AU', 'BE', 'BG', 'BO', 'BR', 'CA', 'CH', 'CL', 'CO', 'CR', 'CY', 'CZ',
      'DE', 'DK', 'DO', 'EC', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'GT', 'HK', 'HN', 'HU', 'ID',
      'IE', 'IS', 'IT', 'JP', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'MX', 'MY', 'NI', 'NL', 'NO',
      'NZ', 'PA', 'PE', 'PH', 'PL', 'PT', 'PY', 'SE', 'SG', 'SK', 'SV', 'TH', 'TR', 'TW', 'US', 'UY', 'VN'
    ];
  }
}

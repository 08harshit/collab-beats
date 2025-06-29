import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RoomUpdate {
  type: 'userJoined' | 'userLeft' | 'songAdded' | 'songRemoved' | 'roomCreated' | 'roomUpdated' | 'roomDeleted' | 'playbackControl' | 'playbackStateUpdate' | 'voteUpdated';
  room?: any;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private roomId: string | null = null;

  constructor() {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Add connection event listeners
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  // Generic emit method
  emit(event: string, data: any): void {
    console.log(`[Socket] Emitting event: ${event}`, data);
    this.socket.emit(event, data);
  }

  joinRoom(roomId: string, userId: string) {
    this.roomId = roomId;
    console.log(`[Socket] Joining room: ${roomId} as user: ${userId}`);
    this.socket.emit('joinRoom', { roomId, userId });
  }

  leaveRoom(roomId: string, userId: string) {
    console.log(`[Socket] Leaving room: ${roomId} as user: ${userId}`);
    this.socket.emit('leaveRoom', { roomId, userId });
    this.roomId = null;
  }

  // Event listeners
  onRoomUpdate(): Observable<RoomUpdate> {
    console.log('[Socket] Setting up room update listener');
    return fromEvent<RoomUpdate>(this.socket, 'roomUpdated');
  }

  onPlaybackControl(): Observable<any> {
    return fromEvent<any>(this.socket, 'playbackControl');
  }

  onPlaybackStateUpdate(): Observable<any> {
    return fromEvent<any>(this.socket, 'playbackStateUpdate');
  }

  onError(): Observable<{ message: string }> {
    return fromEvent<{ message: string }>(this.socket, 'error');
  }
}

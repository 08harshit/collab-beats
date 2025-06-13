import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent } from 'rxjs';
import { environment } from '../../environments/environment';
import { QueueUpdate } from './queue.service';

export interface RoomUpdate {
  type: 'userJoined' | 'userLeft';
  room: any;
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

  joinRoom(roomId: string, userId: string) {
    this.roomId = roomId;
    this.socket.emit('joinRoom', { roomId, userId });
  }

  leaveRoom(roomId: string, userId: string) {
    this.socket.emit('leaveRoom', { roomId, userId });
    this.roomId = null;
  }

  // Event listeners
  onRoomUpdate(): Observable<RoomUpdate> {
    return fromEvent<RoomUpdate>(this.socket, 'roomUpdated');
  }

  onQueueUpdate(): Observable<QueueUpdate> {
    return fromEvent<QueueUpdate>(this.socket, 'queueUpdated');
  }

  onError(): Observable<{ message: string }> {
    return fromEvent<{ message: string }>(this.socket, 'error');
  }

  // Queue-related methods
  emitAddToQueue(payload: { roomId: string; songId: number; userId: number }): void {
    this.socket.emit('addToQueue', payload);
  }

  emitRemoveFromQueue(payload: { roomId: string; queueId: number; userId: number }): void {
    this.socket.emit('removeFromQueue', payload);
  }

  emitMoveInQueue(payload: {
    roomId: string;
    queueId: number;
    newPosition: number;
    userId: number;
  }): void {
    this.socket.emit('moveInQueue', payload);
  }

  emitClearQueue(payload: { roomId: string; userId: number }): void {
    this.socket.emit('clearQueue', payload);
  }
}

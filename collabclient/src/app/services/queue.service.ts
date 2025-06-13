import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';

export interface QueueItem {
  id: number;
  songId: number;
  userId: number;
  position: number;
  status: string;
  addedAt: Date;
  song: {
    id: number;
    title: string;
    artist: string;
    duration: number;
    albumArtUrl: string;
    addedBy: {
      id: number;
      name: string;
      avatarUrl: string;
    };
  };
  user: {
    id: number;
    name: string;
    avatarUrl: string;
  };
}

export interface QueueUpdate {
  type: 'songAdded' | 'songRemoved' | 'queueReordered' | 'queueCleared';
  queueItem?: QueueItem;
  queueId?: number;
  queue?: QueueItem[];
}

@Injectable({
  providedIn: 'root',
})
export class QueueService {
  private apiUrl = environment.apiUrl;
  private queueSubject = new BehaviorSubject<QueueItem[]>([]);
  queue$ = this.queueSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
  ) {
    // Subscribe to queue updates from WebSocket
    this.socketService.onQueueUpdate().subscribe((update: QueueUpdate) => {
      const currentQueue = this.queueSubject.value;

      switch (update.type) {
        case 'songAdded':
          if (update.queueItem) {
            this.queueSubject.next([...currentQueue, update.queueItem]);
          }
          break;

        case 'songRemoved':
          if (update.queueId) {
            this.queueSubject.next(
              currentQueue.filter((item) => item.id !== update.queueId),
            );
          }
          break;

        case 'queueReordered':
          if (update.queue) {
            this.queueSubject.next(update.queue);
          }
          break;

        case 'queueCleared':
          this.queueSubject.next([]);
          break;
      }
    });
  }

  addToQueue(roomId: string, songId: string, userId: number): Observable<QueueItem> {
    return this.http.post<QueueItem>(`${this.apiUrl}/queue/${roomId}`, {
      songId,
      userId,
    });
  }

  removeFromQueue(roomId: string, queueId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/queue/${roomId}/${queueId}`, {
      body: { userId },
    });
  }

  getQueue(roomId: string): Observable<QueueItem[]> {
    return this.http.get<QueueItem[]>(`${this.apiUrl}/queue/${roomId}`);
  }

  moveInQueue(
    roomId: string,
    queueId: number,
    newPosition: number,
    userId: number,
  ): Observable<QueueItem[]> {
    return this.http.post<QueueItem[]>(
      `${this.apiUrl}/queue/${roomId}/${queueId}/move`,
      {
        newPosition,
        userId,
      },
    );
  }

  clearQueue(roomId: string, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/queue/${roomId}`, {
      body: { userId },
    });
  }

  // WebSocket methods
  addToQueueSocket(roomId: string, songId: number, userId: number): void {
    this.socketService.emitAddToQueue({ roomId, songId, userId });
  }

  removeFromQueueSocket(roomId: string, queueId: number, userId: number): void {
    this.socketService.emitRemoveFromQueue({ roomId, queueId, userId });
  }

  moveInQueueSocket(
    roomId: string,
    queueId: number,
    newPosition: number,
    userId: number,
  ): void {
    this.socketService.emitMoveInQueue({
      roomId,
      queueId,
      newPosition,
      userId,
    });
  }

  clearQueueSocket(roomId: string, userId: number): void {
    this.socketService.emitClearQueue({ roomId, userId });
  }
}

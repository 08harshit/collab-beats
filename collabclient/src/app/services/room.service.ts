import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';

export interface RoomResponse {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  hostId: number;  // Use number to match backend
  members?: any[];
  songs?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {}

  createRoom(payload: {
    code: string;
    name: string;
    isActive: boolean;
    hostId: number;  // Use number to match backend
  }): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(`${this.apiUrl}/room`, payload).pipe(
      tap(room => {
        // Join socket room after successful creation
        this.socketService.joinRoom(room.id, payload.hostId.toString());
      })
    );
  }

  joinRoom(roomId: string, userId: number): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(`${this.apiUrl}/room/${roomId}/join`, {
      userId,
      isGuest: false
    }).pipe(
      tap(room => {
        // Join socket room after successful join
        this.socketService.joinRoom(room.id, userId.toString());
      })
    );
  }

  getRoomDetails(roomId: string): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/room/${roomId}`);
  }

  getRoomByCode(code: string): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/room/code/${code}`);
  }
}

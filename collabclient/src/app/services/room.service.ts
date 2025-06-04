import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RoomResponse {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  hostId: string;
  members?: any[];
  songs?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createRoom(payload: {
    code: string;
    name: string;
    isActive: boolean;
    hostId: string;
  }): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(`${this.apiUrl}/room`, payload);
  }

  joinRoom(roomId: string, userId: string): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(`${this.apiUrl}/room/${roomId}/join`, {
      userId,
      isGuest: false
    });
  }

  getRoomDetails(roomId: string): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/room/${roomId}`);
  }

  getRoomByCode(code: string): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/room/code/${code}`);
  }
}

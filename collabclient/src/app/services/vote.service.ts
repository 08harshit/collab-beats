import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  private apiUrl = 'http://localhost:3000/api/vote';

  constructor(private http: HttpClient) {}

  voteSong(songId: number, userId: number, voteValue: 1 | -1, roomId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/song/${songId}`, {
      userId,
      voteValue,
      roomId
    });
  }

  removeVote(songId: number, userId: number, roomId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/song/${songId}`, {
      body: {
        userId,
        roomId
      }
    });
  }

  getSongVotes(songId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/song/${songId}`);
  }
}

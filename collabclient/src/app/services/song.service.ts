import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SongService {

  private apiUrl = 'http://localhost:3000/api/spotify/search';
  private roomApiUrl = 'http://localhost:3000/api/room';

  constructor(private http: HttpClient) { }

  search(query: string): Observable<any> {
    const params = new HttpParams().set('q', query);
    return this.http.get<any>(this.apiUrl, { params });
  }

  addSongToQueue(roomId: string, songId: number): Observable<any> {
    return this.http.post(`${this.roomApiUrl}/${roomId}/songs`, { songId });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  constructor(private http: HttpClient) {}

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
}

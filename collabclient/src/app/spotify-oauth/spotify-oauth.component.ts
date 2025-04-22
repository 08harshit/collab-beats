import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-spotify-oauth',
  imports: [RouterOutlet],
  templateUrl: './spotify-oauth.component.html',
  styleUrl: './spotify-oauth.component.scss'
})
export class SpotifyOAuthComponent {

  constructor(private httpClient: HttpClient) {

    const url = 'https://accounts.spotify.com/authorize';
    const params = new URLSearchParams({
      client_id: environment.spotify.clientId,
      response_type: 'code',
      redirect_uri: environment.spotify.redirectUri,
      scope: environment.spotify.scope,
      state: environment.spotify.state
    });
    const authUrl = `${url}?${params.toString()}`;
    window.location.href = authUrl;
  }
}

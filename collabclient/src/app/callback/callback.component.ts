import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { SpotifyService } from "../services/spotify.service";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { catchError, switchMap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-callback",
  template: "<div>Processing login...</div>",
  standalone: true
})
export class CallbackComponent {
  constructor(
    private spotifyService: SpotifyService,
    private router: Router,
    private httpClient: HttpClient
  ) {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (state !== environment.spotify.state) {
      this.router.navigate(['/'], {
        queryParams: { error: 'state_mismatch' }
      });
      return;
    }

    if (code) {
      this.spotifyService.exchangeToken(code).pipe(
        switchMap((response: any) => {
          localStorage.setItem('spotify_access_token', response.access_token);
          localStorage.setItem('spotify_refresh_token', response.refresh_token);

          return this.httpClient.post('http://localhost:3000/users/add-user', {
            access_token: response.access_token,
            refresh_token: response.refresh_token,
            expires_in: response.expires_in,
          }).pipe(
            catchError(error => {
              console.error('Error saving user data:', error);
              return of(null);
            })
          );
        })
      ).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Authentication error:', error);
          this.router.navigate(['/'], {
            queryParams: { error: 'authentication_failed' }
          });
        }
      });
    }
  }
}


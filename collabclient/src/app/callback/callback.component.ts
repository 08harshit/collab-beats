import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { SpotifyService } from "../services/spotify.service";
import { environment } from "../../environments/environment";

@Component({
  selector: "app-callback",
  template: "<div>Processing login...</div>",
})
export class CallbackComponent {
  constructor(
    private spotifyService: SpotifyService,
    private router: Router
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
      this.spotifyService.exchangeToken(code).subscribe({
        next: (response: any) => {
          // Store tokens in localStorage or a state management solution
          localStorage.setItem('spotify_access_token', response.access_token);
          localStorage.setItem('spotify_refresh_token', response.refresh_token);
          console.log('Tokens received:', response);

          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Token exchange error:', error);
          this.router.navigate(['/'], {
            queryParams: { error: 'token_exchange_failed' }
          });
        }
      });
    }
  }
}


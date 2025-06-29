import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { SpotifyService } from "../services/spotify.service";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { catchError, switchMap } from "rxjs/operators";
import { of } from "rxjs";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-callback",
  templateUrl:'./callback.component.html',
  standalone: true
})
export class CallbackComponent {
  constructor(
    private spotifyService: SpotifyService,
    private router: Router,
    private httpClient: HttpClient,
    private authService: AuthService
  ) {
    this.handleCallback();
  }

  private async handleCallback(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error('Spotify OAuth error:', error);
      this.router.navigate(['/'], {
        queryParams: { error: 'spotify_auth_error' }
      });
      return;
    }

    // Verify state parameter
    if (state !== environment.spotify.state) {
      console.error('State mismatch in OAuth callback');
      this.router.navigate(['/'], {
        queryParams: { error: 'state_mismatch' }
      });
      return;
    }

    if (!code) {
      console.error('No authorization code received');
      this.router.navigate(['/'], {
        queryParams: { error: 'no_code' }
      });
      return;
    }

    try {
      // Exchange code for tokens
      const tokenResponse: any = await this.spotifyService.exchangeToken(code).toPromise();

      if (!tokenResponse.access_token) {
        throw new Error('No access token received');
      }

      // Store tokens
      localStorage.setItem('spotify_access_token', tokenResponse.access_token);
      localStorage.setItem('spotify_refresh_token', tokenResponse.refresh_token);
      localStorage.setItem('spotify_token_expires_at',
        (Date.now() + (tokenResponse.expires_in * 1000)).toString());

      // Get user profile from Spotify
      const userProfile = await this.getCurrentUser(tokenResponse.access_token);

      if (!userProfile) {
        throw new Error('Failed to get user profile');
      }

      // Prepare user data
      const userData = {
        id: userProfile.id,
        name: userProfile.display_name || userProfile.id,
        email: userProfile.email,
        spotifyId: userProfile.id,
        avatarUrl: userProfile.images?.[0]?.url || null,
        country: userProfile.country,
        product: userProfile.product // premium, free, etc.
      };

      // Store user details locally
      localStorage.setItem('user_details', JSON.stringify(userData));
      localStorage.setItem('user_id', userProfile.id);

      // Optional: Save to backend (if you want to persist user data)
      try {
        const backendResponse = await this.httpClient.post('http://localhost:3000/api/users/add-user', {
          ...userData,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_in: tokenResponse.expires_in,
        }).pipe(
          catchError(error => {
            console.warn('Backend user save failed (continuing anyway):', error);
            return of(null);
          })
        ).toPromise();

        if (backendResponse) {
          console.log('User data saved to backend successfully');
        }
      } catch (backendError) {
        console.warn('Backend error (continuing with local storage):', backendError);
      }

      // Update auth state
      this.authService.updateAuthState(true);

      // Check if user has premium (required for Web Playback SDK)
      if (userProfile.product !== 'premium') {
        console.warn('User does not have Spotify Premium - Web Playback SDK requires Premium');
        this.router.navigate(['/'], {
          queryParams: {
            error: 'premium_required',
            message: 'Spotify Premium is required for music playback'
          }
        });
        return;
      }

      // Redirect to home page
      console.log('Authentication successful, redirecting to home');
      this.router.navigate(['/']);

    } catch (error) {
      console.error('Error during authentication:', error);
      this.authService.updateAuthState(false);
      this.router.navigate(['/'], {
        queryParams: { error: 'authentication_failed' }
      });
    }
  }

  private async getCurrentUser(accessToken: string): Promise<any> {
    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${accessToken}`
      });

      const response = await this.httpClient.get('https://api.spotify.com/v1/me', { headers }).toPromise();
      return response;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
}


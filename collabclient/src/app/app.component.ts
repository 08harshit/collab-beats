import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(private router: Router) {
   localStorage.getItem('spotify_access_token');

  }
  title = 'collabclient';
  isSpotifyConnected= true
  connectToSpotify() {
    this.router.navigate(['/connect-spotify']);
  }

  disconnectSpotify() { }

}

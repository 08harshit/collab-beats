import { Routes } from '@angular/router';
import { CallbackComponent } from './callback/callback.component';
import { SpotifyOAuthComponent } from './spotify-oauth/spotify-oauth.component';
import { RoomComponent } from './room/room.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'connect-spotify', component: SpotifyOAuthComponent },
  { path: 'callback', component: CallbackComponent },
  { path: 'room', component: RoomComponent },
  { path: '**', redirectTo: '' }
];

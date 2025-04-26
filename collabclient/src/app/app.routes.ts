import { Routes } from '@angular/router';
import { CallbackComponent } from './callback/callback.component';

export const routes: Routes = [
  { path: 'connect-spotify', loadComponent: () => import('./spotify-oauth/spotify-oauth.component').then(m => m.SpotifyOAuthComponent) },
  { path: 'callback', component: CallbackComponent },
];

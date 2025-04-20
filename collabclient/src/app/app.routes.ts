import { Routes } from '@angular/router';
import { SpotifyOAuthComponent } from './spotify-oauth/spotify-oauth.component';

export const routes: Routes = [
 {path:'connect-spotify', loadComponent: () => import('./spotify-oauth/spotify-oauth.component').then(m => m.SpotifyOAuthComponent) },
];

import { Routes } from '@angular/router';

export const routes: Routes = [
 {path:'connect-spotify', loadComponent: () => import('./spotify-oauth/spotify-oauth.component').then(m => m.SpotifyOAuthComponent) },
];

// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// import { AuthService } from '../services/auth.service';

// @Component({
//   selector: 'app-spotify-callback',
//   standalone: true,
//   template: '<div>Processing...</div>'
// })
// export class SpotifyCallbackComponent implements OnInit {
//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private http: HttpClient,
//     private authService: AuthService
//   ) {}

//   ngOnInit() {
//     this.route.queryParams.subscribe(params => {
//       const code = params['code'];
//       if (code) {
//         this.http.post('http://localhost:3000/auth/spotify/callback', { code }).subscribe({
//           next: (response: any) => {
//             const { accessToken, refreshToken, userData } = response;
//             localStorage.setItem('spotify_access_token', accessToken);
//             localStorage.setItem('spotify_refresh_token', refreshToken);
//             this.http.post('http://localhost:3000/users/add-user', userData).subscribe({
//               next: (response: any) => {
//                 localStorage.setItem('user_id', response.id.toString());
//                 localStorage.setItem('spotify_access_token', accessToken);
//                 localStorage.setItem('spotify_refresh_token', refreshToken);
//                 this.authService.updateAuthState(true);
//                 this.router.navigate(['/']);
//               },
//               error: (error) => {
//                 console.error('Error saving user:', error);
//                 this.router.navigate(['/']);
//               }
//             });
//           },
//           error: (error) => {
//             console.error('Error during Spotify callback:', error);
//             this.router.navigate(['/']);
//           }
//         });
//       } else {
//         this.router.navigate(['/']);
//       }
//     });
//   }
// }

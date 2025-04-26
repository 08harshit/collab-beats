import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<boolean>(false);
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.checkInitialAuthState();
  }

  private checkInitialAuthState() {
    const userId = localStorage.getItem('user_id');
    const userDetails = localStorage.getItem('user_details');
    this.authStateSubject.next(!!userId && !!userDetails);
  }

  updateAuthState(isAuthenticated: boolean) {
    this.authStateSubject.next(isAuthenticated);
  }
}

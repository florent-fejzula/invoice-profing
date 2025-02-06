import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth) {}

  // Convert the Promise to an Observable
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password));
  }

  // Register method (optional)
  register(email: string, password: string): Observable<any> {
    return from(this.afAuth.createUserWithEmailAndPassword(email, password));
  }

  // Logout method
  logout(): void {
    this.afAuth.signOut();
  }

  // Get current user
  getUser() {
    return this.afAuth.authState;
  }
}

import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth, private firestore: Firestore) {}

  // Login method with subscription status check
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      switchMap((res) => {
        const user = res.user;
        if (user) {
          return from(this.getSubscriptionStatus(user.uid)).pipe(
            map((status) => ({ user, status }))
          );
        } else {
          throw new Error('No user found.');
        }
      })
    );
  }

  // Check subscription status
  getSubscriptionStatus(userId: string): Promise<'active' | 'inactive'> {
    const userRef = doc(this.firestore, `subscriptions/${userId}`);
    return getDoc(userRef).then((docSnap) =>
      docSnap.exists()
        ? (docSnap.data()['status'] as 'active' | 'inactive')
        : 'inactive'
    );
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

import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface SubscriptionData {
  status: 'active' | 'inactive';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // Login method with subscription status check
  login(email: string, password: string): Observable<{ user: User; status: 'active' | 'inactive' }> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
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
  async getSubscriptionStatus(userId: string): Promise<'active' | 'inactive'> {
    const userRef = doc(this.firestore, `subscriptions/${userId}`);
    const docSnap = await getDoc(userRef);
    const data = docSnap.data() as SubscriptionData | undefined;
    return data?.status ?? 'inactive';
  }

  // Register method
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  // Logout method
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // Get current user as observable
  getUser(): Observable<User | null> {
    return new Observable((observer) => {
      onAuthStateChanged(this.auth, (user) => {
        observer.next(user);
      });
    });
  }
}

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map, tap, switchMap, take } from 'rxjs/operators';

interface Subscription {
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      take(1), // Take only the first emission to prevent multiple checks
      switchMap(user => {
        if (user) {
          // Fetch the user's subscription status from Firestore
          return this.firestore
            .collection<Subscription>('subscriptions')
            .doc(user.uid)  // Assuming the user's Firestore document is named by their UID
            .valueChanges();
        } else {
          return [null];
        }
      }),
      map(subscription => {
        if (subscription && subscription.status === 'active') {
          return true; // Allow access if the user is active
        } else {
          console.log('User is inactive or no subscription found.');
          return false; // Deny access if inactive
        }
      }),
      tap(loggedIn => {
        if (!loggedIn) {
          this.router.navigate(['/login']);
        }
      })
    );
  }
}

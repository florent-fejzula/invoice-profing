import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (!user) {
          console.log('Access denied. Redirecting to login.');
          this.router.navigate(['/login']);
          return of(false);
        }

        return this.firestore
          .collection('subscriptions')
          .doc(user.uid)
          .valueChanges()
          .pipe(
            map((subscription: any) => subscription?.status === 'active'),
            tap(isActive => {
              if (!isActive) {
                console.log('Subscription inactive. Redirecting to login.');
                this.router.navigate(['/login']);
              }
            })
          );
      })
    );
  }
}

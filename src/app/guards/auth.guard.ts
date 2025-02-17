import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private firestore: Firestore
  ) {}

  canActivate(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1),
      switchMap(user => {
        if (user && user.email) {
          // Query companies collection by matching the email field
          const companyQuery = query(
            collection(this.firestore, 'companies'),
            where('email', '==', user.email)
          );
          return collectionData(companyQuery, { idField: 'id' }).pipe(
            map(companies => companies.length > 0 && companies[0]['status'] === 'active')
          );
        } else {
          return of(false);
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

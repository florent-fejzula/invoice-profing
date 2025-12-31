import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap, map, tap, take, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
    private firestore: Firestore
  ) {}

  canActivate(): Observable<boolean> {
    return authState(this.auth).pipe(
      take(1),
      switchMap((u) => {
        if (!u?.uid) return of(false);

        return from(this.isActiveUserCompany(u.uid)).pipe(
          catchError((err) => {
            console.error('AuthGuard error:', err);
            return of(false);
          })
        );
      }),
      tap((ok) => {
        if (!ok) this.router.navigate(['/login']);
      })
    );
  }

  private async isActiveUserCompany(uid: string): Promise<boolean> {
    // 1) read users/{uid}
    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;

    const profile = userSnap.data() as any;
    const companyId = profile?.defaultCompanyId;
    if (!companyId) return false;

    // 2) read companies/{companyId}
    const companyRef = doc(this.firestore, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    if (!companySnap.exists()) return false;

    const company = companySnap.data() as any;
    return (company?.status ?? 'active') === 'active';
  }
}

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Auth, user } from '@angular/fire/auth'; // ✅ Use modular Firebase Auth

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return user(this.auth).pipe(
      take(1),
      map(firebaseUser => {
        if (firebaseUser?.email === 'fejzula.florent@hotmail.com') {
          return true; // ✅ Allow access if the user is admin
        } else {
          this.router.navigate(['/']); // ❌ Redirect if not admin
          return false;
        }
      })
    );
  }
}

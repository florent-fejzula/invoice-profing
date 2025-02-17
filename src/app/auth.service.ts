import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User,
  setPersistence,
  browserLocalPersistence,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // ✅ Login method with auth persistence
  login(email: string, password: string): Observable<{ user: User; status: 'active' | 'inactive' }> {
    return from(
      this.auth.setPersistence(browserLocalPersistence).then(() =>
        signInWithEmailAndPassword(this.auth, email, password)
      )
    ).pipe(
      switchMap((res) => {
        const user = res.user;
        if (user && user.email) {
          return from(this.getCompanyStatus(user.email)).pipe(
            map((status) => ({ user, status }))
          );
        } else {
          throw new Error('No user found or email is missing.');
        }
      })
    );
  }

  // ✅ Check company status based on the user email
  async getCompanyStatus(email: string): Promise<'active' | 'inactive'> {
    const companyQuery = query(
      collection(this.firestore, 'companies'),
      where('email', '==', email)
    );
    const companySnapshot = await getDocs(companyQuery);
    if (!companySnapshot.empty) {
      const companyData = companySnapshot.docs[0].data() as {
        status: 'active' | 'inactive';
      };
      return companyData.status;
    }
    return 'inactive';
  }

  // ✅ Register method
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  // ✅ Logout method
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  // ✅ Get current user as observable
  getUser(): Observable<User | null> {
    return authState(this.auth);
  }

  // ✅ Check if user is logged in
  isLoggedIn(): Observable<boolean> {
    return this.getUser().pipe(map((user) => !!user));
  }
}

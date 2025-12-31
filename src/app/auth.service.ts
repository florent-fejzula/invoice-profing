import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User,
  browserLocalPersistence,
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private auth: Auth, private firestore: Firestore) {}

  // ✅ Login method with auth persistence
  login(
    email: string,
    password: string
  ): Observable<{ user: User; status: 'active' | 'inactive' }> {
    return from(
      this.auth
        .setPersistence(browserLocalPersistence)
        .then(() => signInWithEmailAndPassword(this.auth, email, password))
    ).pipe(
      switchMap((res) => {
        const user = res.user;
        if (user?.uid) {
          return from(this.getCompanyStatus(user.uid)).pipe(
            map((status) => ({ user, status }))
          );
        } else {
          throw new Error('No user found.');
        }
      })
    );
  }

  async getCompanyStatus(uid: string): Promise<'active' | 'inactive'> {
    // 1) Read users/{uid}
    const userRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return 'inactive';

    const profile = userSnap.data() as any;
    const companyId = profile?.defaultCompanyId;
    if (!companyId) return 'inactive';

    // 2) Read companies/{companyId}
    const companyRef = doc(this.firestore, 'companies', companyId);
    const companySnap = await getDoc(companyRef);

    if (!companySnap.exists()) return 'inactive';

    const companyData = companySnap.data() as any;
    return (companyData?.status ?? 'active') as 'active' | 'inactive';
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

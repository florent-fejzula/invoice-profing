import { Injectable } from '@angular/core';
import { Firestore, doc, docData, DocumentData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  getCompany(): Observable<DocumentData | null> {
    return user(this.auth).pipe(
      switchMap((u) => {
        if (!u?.uid) return of(null);

        const userRef = doc(this.firestore, 'users', u.uid);

        return (docData(userRef) as Observable<any>).pipe(
          map((profile) => profile ?? null), // ✅ convert undefined -> null
          switchMap((profile) => {
            const companyId = profile?.defaultCompanyId;
            if (!companyId) return of(null);

            const companyRef = doc(this.firestore, 'companies', companyId);

            return (
              docData(companyRef, { idField: 'id' }) as Observable<
                DocumentData | undefined
              >
            ).pipe(map((c) => c ?? null));
          })
        );
      })
    );
  }
}

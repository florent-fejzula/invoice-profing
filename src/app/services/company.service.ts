import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, collectionData, DocumentData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  getCompany(): Observable<DocumentData | null> {
    return user(this.auth).pipe(
      switchMap(currentUser => {
        if (!currentUser || !currentUser.email) return of(null);
        // Query the companies collection using the current user's email
        const companyQuery = query(
          collection(this.firestore, 'companies'),
          where('email', '==', currentUser.email)
        );
        return collectionData(companyQuery, { idField: 'id' }).pipe(
          map(companies => (companies.length > 0 ? companies[0] : null))
        );
      })
    );
  }
}

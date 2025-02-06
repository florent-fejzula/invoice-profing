import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  constructor(private firestore: Firestore) {}

  async setSubscriptionStatus(userId: string, status: 'active' | 'inactive') {
    const userRef = doc(this.firestore, `subscriptions/${userId}`);
    await setDoc(userRef, { status });
  }

  async getSubscriptionStatus(userId: string): Promise<'active' | 'inactive'> {
    const userRef = doc(this.firestore, `subscriptions/${userId}`);
    const docSnap = await getDoc(userRef);
    return docSnap.exists() ? (docSnap.data()['status'] as 'active' | 'inactive') : 'inactive';
  }
}

import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
  query, orderBy, where, limit as qLimit, startAt, endAt
} from '@angular/fire/firestore';
import { ClientDoc } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  constructor(private db: Firestore) {}

  private col(companyId: string) {
    return collection(this.db, `companies/${companyId}/clients`);
  }

  /** Create client */
  async create(companyId: string, data: Omit<ClientDoc, 'id'|'createdAt'|'updatedAt'|'isActive'|'companyId'>) {
    const now = Date.now();
    const payload: ClientDoc = {
      companyId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    const ref = await addDoc(this.col(companyId), payload as any);
    return ref.id;
  }

  /** Update client */
  async update(companyId: string, clientId: string, partial: Partial<ClientDoc>) {
    const ref = doc(this.db, `companies/${companyId}/clients/${clientId}`);
    await setDoc(ref, { ...partial, updatedAt: Date.now() }, { merge: true });
  }

  /** Get one client */
  async get(companyId: string, clientId: string): Promise<ClientDoc | null> {
    const snap = await getDoc(doc(this.db, `companies/${companyId}/clients/${clientId}`));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as ClientDoc) : null;
  }

  /** List recent/active clients */
  async list(companyId: string, limitN = 100): Promise<ClientDoc[]> {
    const q = query(this.col(companyId), orderBy('name'), qLimit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ClientDoc));
  }

  /** Prefix search for typeahead (by name). Requires `orderBy('name')`. */
  async searchByName(companyId: string, term: string, limitN = 10): Promise<ClientDoc[]> {
    const cleaned = term.trim();
    if (!cleaned) return [];
    // simple prefix match using startAt/endAt with unicode high char
    const high = '\uf8ff';
    const q = query(
      this.col(companyId),
      orderBy('name'),
      startAt(cleaned),
      endAt(cleaned + high),
      qLimit(limitN)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ClientDoc));
  }
}

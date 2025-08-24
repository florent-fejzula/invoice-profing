import { Injectable } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
  query, orderBy, limit as qLimit
} from '@angular/fire/firestore';
import { InvoiceDoc } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  constructor(private db: Firestore) {}

  private col(companyId: string) {
    return collection(this.db, `companies/${companyId}/invoices`);
  }

  async create(companyId: string, data: Omit<InvoiceDoc,'id'|'createdAt'|'updatedAt'>) {
    const payload: InvoiceDoc = { ...data, createdAt: Date.now(), updatedAt: Date.now() };
    const ref = await addDoc(this.col(companyId), payload as any);
    return ref.id;
  }

  async update(companyId: string, invoiceId: string, partial: Partial<InvoiceDoc>) {
    const ref = doc(this.db, `companies/${companyId}/invoices/${invoiceId}`);
    await setDoc(ref, { ...partial, updatedAt: Date.now() }, { merge: true });
  }

  async get(companyId: string, invoiceId: string): Promise<InvoiceDoc | null> {
    const snap = await getDoc(doc(this.db, `companies/${companyId}/invoices/${invoiceId}`));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as InvoiceDoc) : null;
  }

  async list(companyId: string, limitN = 50): Promise<InvoiceDoc[]> {
    const q = query(this.col(companyId), orderBy('datumIzdavanje', 'desc'), qLimit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as InvoiceDoc));
  }
}

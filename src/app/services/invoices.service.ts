import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit as qLimit,
  where,
  runTransaction,
} from '@angular/fire/firestore';
import { InvoiceDoc } from '../models/invoice.model';

/** Remove all `undefined` fields (deep) so Firestore accepts the payload */
function deepStripUndefined(obj: any): any {
  if (Array.isArray(obj)) return obj.map(deepStripUndefined);
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      out[k] = deepStripUndefined(v);
    }
    return out;
  }
  return obj;
}

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  constructor(private db: Firestore) {}

  private col(companyId: string) {
    return collection(this.db, `companies/${companyId}/invoices`);
  }

  /** Create a new invoice doc */
  async create(
    companyId: string,
    data: Omit<InvoiceDoc, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const raw: any = { ...data, createdAt: Date.now(), updatedAt: Date.now() };
    const payload = deepStripUndefined(raw); // 🔧 remove undefined recursively
    const ref = await addDoc(this.col(companyId), payload);
    return ref.id;
  }

  /** Update an existing invoice doc */
  async update(
    companyId: string,
    invoiceId: string,
    partial: Partial<InvoiceDoc>
  ) {
    const ref = doc(this.db, `companies/${companyId}/invoices/${invoiceId}`);
    const payload = deepStripUndefined({ ...partial, updatedAt: Date.now() });
    await setDoc(ref, payload, { merge: true });
  }

  /** Get one invoice by id */
  async get(companyId: string, invoiceId: string): Promise<InvoiceDoc | null> {
    const snap = await getDoc(
      doc(this.db, `companies/${companyId}/invoices/${invoiceId}`)
    );
    return snap.exists()
      ? ({ id: snap.id, ...(snap.data() as any) } as InvoiceDoc)
      : null;
  }

  /** List recent invoices */
  async list(companyId: string, limitN = 50): Promise<InvoiceDoc[]> {
    const qy = query(
      this.col(companyId),
      orderBy('datumIzdavanje', 'desc'),
      qLimit(limitN)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as InvoiceDoc)
    );
  }

  // ---------- AUTO-NUMBERING ----------

  /**
   * Concurrency-safe allocator for invoice numbers using a Firestore transaction.
   * Uses /companies/{companyId}/counters/invoices with fields: {year, nextSeq}
   * Format: `${prefix}/${seq.padStart(6)}`
   * Default prefix = current year.
   */
  async allocateNumberTx(
    companyId: string,
    prefix?: string
  ): Promise<{ broj: string; seq: number; year: number; month: number }> {
    const counterRef = doc(this.db, `companies/${companyId}/counters/invoices`);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const res = await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(counterRef);

      let nextSeq = 1;
      let storedYear = year;

      if (snap.exists()) {
        const data = snap.data() as any;
        storedYear = data.year ?? year;
        const currentNext = data.nextSeq ?? 1;

        // Reset yearly
        if (storedYear !== year) {
          nextSeq = 1;
          storedYear = year;
        } else {
          nextSeq = currentNext;
        }
      }

      // increment for next caller
      tx.set(
        counterRef,
        { year: storedYear, nextSeq: nextSeq + 1 },
        { merge: true }
      );

      const pad = (n: number) => String(n).padStart(6, '0');
      const thePrefix = prefix ?? String(year);
      const broj = `${thePrefix}/${pad(nextSeq)}`;

      return { broj, seq: nextSeq, year: storedYear, month };
    });

    return res;
  }

  /**
   * Optional: simple local allocator (not concurrency-safe).
   * Kept here as a fallback or for single-user scenarios.
   */
  async allocateLocalNumber(
    companyId: string,
    prefix?: string
  ): Promise<{ broj: string; seq: number; year: number; month: number }> {
    const colRef = this.col(companyId);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const qy = query(
      colRef,
      where('year', '==', year),
      orderBy('seq', 'desc'),
      qLimit(1)
    );
    const snap = await getDocs(qy);
    const lastSeq = snap.empty ? 0 : (snap.docs[0].data() as any).seq ?? 0;

    const nextSeq = lastSeq + 1;
    const pad = (n: number) => String(n).padStart(6, '0');
    const thePrefix = prefix ?? String(year);
    const broj = `${thePrefix}/${pad(nextSeq)}`;

    return { broj, seq: nextSeq, year, month };
  }
}

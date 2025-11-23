import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';

import { GradezhnaKnigaDoc } from 'src/app/models/gradezhna-kniga.model';

@Injectable({ providedIn: 'root' })
export class GradezhnaKnigaService {
  constructor(private firestore: Firestore) {}

  private collectionRef(companyId: string) {
    return collection(
      this.firestore,
      'companies',
      companyId,
      'gradezhna-kniga'
    );
  }

  async create(
    companyId: string,
    data: Omit<GradezhnaKnigaDoc, 'id'>
  ): Promise<string> {
    const col = this.collectionRef(companyId);
    const ref = await addDoc(col, data as any);
    return ref.id;
  }

  async update(
    companyId: string,
    id: string,
    data: Partial<GradezhnaKnigaDoc>
  ): Promise<void> {
    const ref = doc(
      this.firestore,
      'companies',
      companyId,
      'gradezhna-kniga',
      id
    );
    await updateDoc(ref, data as any);
  }

  async get(companyId: string, id: string): Promise<GradezhnaKnigaDoc | null> {
    const ref = doc(
      this.firestore,
      'companies',
      companyId,
      'gradezhna-kniga',
      id
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as GradezhnaKnigaDoc;
  }

  async delete(companyId: string, id: string): Promise<void> {
    const ref = doc(
      this.firestore,
      'companies',
      companyId,
      'gradezhna-kniga',
      id
    );
    await deleteDoc(ref);
  }

  async list(companyId: string, pageSize = 50): Promise<GradezhnaKnigaDoc[]> {
    const col = this.collectionRef(companyId);
    const q = query(col, orderBy('createdAt', 'desc'), limit(pageSize));
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) => ({ id: d.id, ...(d.data() as any) } as GradezhnaKnigaDoc)
    );
  }
}

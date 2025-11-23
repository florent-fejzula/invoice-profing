import { Injectable } from '@angular/core';
import { GradezhnaKnigaService } from './gradezhna-kniga.service';
import {
  GradezhnaKnigaDoc,
  GradezhnaKnigaPayload,
} from 'src/app/models/gradezhna-kniga.model';

export interface GradezhnaKnigaEditorData {
  id: string;
  payload: GradezhnaKnigaPayload;
}

export interface SaveGradezhnaKnigaParams {
  companyId: string;
  currentBookId: string | null;
  userUid: string;
  payload: GradezhnaKnigaPayload;
}

export interface SaveGradezhnaKnigaResult {
  id: string;
  isNew: boolean;
}

@Injectable({ providedIn: 'root' })
export class GradezhnaKnigaPersistenceService {
  constructor(private svc: GradezhnaKnigaService) {}

  async loadForEdit(
    companyId: string,
    bookId: string
  ): Promise<GradezhnaKnigaEditorData> {
    const doc = await this.svc.get(companyId, bookId);
    if (!doc) throw new Error('BOOK_NOT_FOUND');

    const payload: GradezhnaKnigaPayload = {
      gradbaBroj: doc.gradbaBroj || '',
      gradbaInputValue: doc.gradbaInputValue || '',
      knigaInputValue: doc.knigaInputValue || '',
      datumInputValue: doc.datumInputValue || '',
      investorInputValue: doc.investorInputValue || '',
      adresaInputValue: doc.adresaInputValue || '',
      pozicijaInputValue: doc.pozicijaInputValue || '',
      merkaInputValue: doc.merkaInputValue || '',
      cenaInputValue: doc.cenaInputValue,
      tableData: doc.tableData || [],
      div4InputValue: doc.div4InputValue ?? 0,
    };

    return { id: doc.id!, payload };
  }

  async save(
    params: SaveGradezhnaKnigaParams
  ): Promise<SaveGradezhnaKnigaResult> {
    const { companyId, currentBookId, userUid, payload } = params;

    // Base data used for BOTH create & update (without createdAt/createdByUid)
    type GradezhnaBase = Omit<
      GradezhnaKnigaDoc,
      'id' | 'createdAt' | 'createdByUid'
    >;

    const baseData: GradezhnaBase = {
      ...payload,
      companyId,
      updatedAt: Date.now(),
    };

    // ---------- UPDATE EXISTING ----------
    if (currentBookId) {
      // Do NOT send createdAt / createdByUid on update
      await this.svc.update(companyId, currentBookId, baseData);
      return { id: currentBookId, isNew: false };
    }

    // ---------- CREATE NEW ----------
    const newDoc: Omit<GradezhnaKnigaDoc, 'id'> = {
      ...baseData,
      createdByUid: userUid,
      createdAt: Date.now(),
    };

    const newId = await this.svc.create(companyId, newDoc);
    return { id: newId, isNew: true };
  }
}

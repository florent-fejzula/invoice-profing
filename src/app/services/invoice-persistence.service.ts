import { Injectable } from '@angular/core';
import { InvoicesService } from './invoices.service';
import { InvoiceItem } from 'src/app/models/invoice-item.model';
import { InvoiceHeaderState } from 'src/app/pages/invoice-app/dashboard/invoice-header/invoice-header.component';
import { computeTotals } from 'src/app/utils/compute-totals';

export interface InvoiceEditorData {
  id: string;
  header: InvoiceHeaderState;
  items: InvoiceItem[];
  soZborovi: string;
  napomena: string;
  isNoteVisible: boolean;
}

export interface SaveInvoiceParams {
  companyId: string;
  currentInvoiceId: string | null;
  userUid: string;
  header: InvoiceHeaderState;
  items: InvoiceItem[];
  soZborovi: string;
  napomena: string;
  isNoteVisible: boolean;
}

export interface SaveInvoiceResult {
  id: string;
  broj: string;
  isNew: boolean;
}

@Injectable({ providedIn: 'root' })
export class InvoicePersistenceService {
  constructor(private invoicesSvc: InvoicesService) {}

  /** Load one invoice from Firestore and map it into editor-friendly shape */
  async loadForEdit(
    companyId: string,
    invoiceId: string
  ): Promise<InvoiceEditorData> {
    const doc = await this.invoicesSvc.get(companyId, invoiceId);
    if (!doc) {
      throw new Error('INVOICE_NOT_FOUND');
    }

    const header: InvoiceHeaderState = {
      datum: new Date(doc.datumIzdavanje),
      valuta: doc.datumValuta
        ? new Date(doc.datumValuta)
        : new Date(doc.datumIzdavanje),
      fakturaTip: 'Фактура', // we don't store this in Firestore yet
      fakturaBroj: doc.broj,
      companyTitle: doc.klientIme || '',
      companyID: doc.klientEDB || '',
      companyAddress: doc.klientAdresa || '',
      companyCity: (doc as any).klientGrad || '',
      companyEmail: doc.klientEmail || '',
      companyPhone: doc.klientTelefon || '',
    };

    return {
      id: doc.id!,
      header,
      items: doc.stavki || [],
      soZborovi: (doc as any).soZborovi || '',
      napomena: doc.zabeleshka || '',
      isNoteVisible:
        typeof (doc as any).noteVisible === 'boolean'
          ? (doc as any).noteVisible
          : true,
    };
  }

  /** Save (create or update) an invoice based on presence of currentInvoiceId */
  async save(params: SaveInvoiceParams): Promise<SaveInvoiceResult> {
    const {
      companyId,
      currentInvoiceId,
      userUid,
      header,
      items,
      soZborovi,
      napomena,
      isNoteVisible,
    } = params;

    const brojTrimmed = (header.fakturaBroj || '').trim();
    const totals = computeTotals(items);

    // ---------- UPDATE EXISTING ----------
    if (currentInvoiceId) {
      await this.invoicesSvc.update(companyId, currentInvoiceId, {
        broj: brojTrimmed,
        status: 'draft',
        datumIzdavanje:
          header.datum?.getTime?.() ?? new Date(header.datum).getTime(),
        datumValuta: header.valuta
          ? header.valuta.getTime?.() ?? new Date(header.valuta).getTime()
          : undefined,
        klientIme: header.companyTitle || '',
        klientEDB: header.companyID || '',
        klientAdresa: header.companyAddress || '',
        klientGrad: header.companyCity || '',
        klientEmail: header.companyEmail || '',
        klientTelefon: header.companyPhone || '',
        valuta: 'MKD',
        stavki: items,
        iznosBezDDV: totals.iznosBezDDV,
        ddvVkupno: totals.vkupnoDDV,
        vkupno: totals.vkupno,
        zabeleshka: napomena || '',
        soZborovi: soZborovi || '',
        noteVisible: isNoteVisible,
      });

      return { id: currentInvoiceId, broj: brojTrimmed, isNew: false };
    }

    // ---------- CREATE NEW ----------
    let broj = brojTrimmed;
    let seq = 0;
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;

    if (!broj) {
      // Allocate via transaction
      const alloc = await this.invoicesSvc.allocateNumberTx(companyId);
      broj = alloc.broj;
      seq = alloc.seq;
      year = alloc.year;
      month = alloc.month;
    } else {
      // derive seq/year from manual broj if in format YYYY/NNNNNN
      const match = /^(\d{4})\/(\d+)$/.exec(broj);
      if (match) {
        year = Number(match[1]);
        seq = Number(match[2]);
      }
      const d = header.datum ?? new Date();
      const asDate = d instanceof Date ? d : new Date(d);
      month = asDate.getMonth() + 1;
    }

    const newId = await this.invoicesSvc.create(companyId, {
      companyId,
      broj,
      seq,
      year,
      month,
      status: 'draft',
      datumIzdavanje:
        header.datum?.getTime?.() ?? new Date(header.datum).getTime(),
      datumValuta: header.valuta
        ? header.valuta.getTime?.() ?? new Date(header.valuta).getTime()
        : undefined,
      klientIme: header.companyTitle || '',
      klientEDB: header.companyID || '',
      klientAdresa: header.companyAddress || '',
      klientGrad: header.companyCity || '',
      klientEmail: header.companyEmail || '',
      klientTelefon: header.companyPhone || '',
      valuta: 'MKD',
      stavki: items,
      iznosBezDDV: totals.iznosBezDDV,
      ddvVkupno: totals.vkupnoDDV,
      vkupno: totals.vkupno,
      zabeleshka: napomena || '',
      soZborovi: soZborovi || '',
      noteVisible: isNoteVisible,
      createdByUid: userUid,
    });

    return { id: newId, broj, isNew: true };
  }
}

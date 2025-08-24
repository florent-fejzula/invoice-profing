import { InvoiceItem } from './invoice-item.model';

export type Valuta = 'MKD' | 'EUR';

export interface InvoiceDoc {
  id?: string;                      // Firestore id (filled when reading)
  companyId: string;

  broj: string;                     // invoice number (manual for now)
  status: 'draft' | 'sent' | 'paid' | 'void';

  datumIzdavanje: number;           // Date.getTime()
  datumValuta?: number;             // due date (optional)

  // minimal client snapshot (we’ll add clients DB in Step 2)
  klientIme: string;
  klientEDB?: string;
  klientAdresa?: string;
  klientEmail?: string;
  klientTelefon?: string;

  valuta: Valuta;

  stavki: InvoiceItem[];

  // totals (computed on client before save)
  iznosBezDDV: number;              // subtotal (no VAT)
  ddvVkupno: number;                 // total VAT
  vkupno: number;                    // grand total (with VAT)

  zabeleshka?: string;

  createdByUid: string;
  createdAt: number;
  updatedAt: number;
}

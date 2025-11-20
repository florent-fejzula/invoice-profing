import { InvoiceItem } from './invoice-item.model';

export type Valuta = 'MKD' | 'EUR';

export interface InvoiceDoc {
  id?: string;
  companyId: string;

  // numbering
  broj: string;
  seq?: number; // ← add
  year?: number; // ← add
  month?: number; // ← add

  status: 'draft' | 'sent' | 'paid' | 'void';

  datumIzdavanje: number; // ms since epoch
  datumValuta?: number;

  // client snapshot
  klientIme: string;
  klientEDB?: string;
  klientAdresa?: string;
  klientEmail?: string;
  klientTelefon?: string;
  klientGrad?: string;

  valuta: Valuta;
  stavki: InvoiceItem[];

  // totals
  iznosBezDDV: number;
  ddvVkupno: number;
  vkupno: number;

  zabeleshka?: string; // your “Напомена” block
  slobodenOpis?: string; // ⬅️ NEW: free text row
  soZborovi?: string; // ⬅️ NEW: “Со зборови”
  noteVisible?: boolean; // ⬅️ NEW: Danocna obvrska toggle

  createdByUid: string;
  createdAt: number;
  updatedAt: number;
}

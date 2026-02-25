export interface InvoiceItem {
  opis: string;              // description
  em?: string;               // unit (Е М)
  kolicina: number;          // qty
  cenaBezDanok: number;      // unit price (no VAT)
  cenaSoDdv?: number;
  rabatProcent?: number;     // % discount
  rabat?: number;            // fixed discount (MKD)
  ddv?: number;              // VAT %
  iznosSoDDV?: number;       // (optional, UI convenience)
}
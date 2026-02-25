import { InvoiceItem } from '../models/invoice-item.model';

export interface SummaryRow {
  ddvTarifa: number;
  iznosBezDDV: number;
  vkupnoDDV: number;
  iznosSoDDV: number;
}

/** Totals for the whole invoice */
export function computeTotals(items: InvoiceItem[]) {
  let iznosBezDDV = 0;
  let vkupnoDDV = 0;

  for (const it of items) {
    const qty = it.kolicina ?? 0;
    const unit = it.cenaBezDanok ?? 0;
    const pct = (it.rabatProcent ?? 0) / 100; // % discount
    const vat = (it.ddv ?? 0) / 100;

    const base = qty * unit;
    const afterPct = base * (1 - pct);

    const lineNet = Math.max(0, afterPct); // (if you add fixed rabat later, handle it here)
    const lineVAT = lineNet * vat;

    iznosBezDDV += lineNet;
    vkupnoDDV += lineVAT;
  }

  const vkupno = iznosBezDDV + vkupnoDDV;
  return { iznosBezDDV, vkupnoDDV, vkupno };
}

/** Summary table grouped by DDV tariff */
export function computeSummaryByDDV(items: InvoiceItem[]): SummaryRow[] {
  const uniqueTariffs = Array.from(new Set(items.map((i) => i.ddv ?? 0))).sort(
    (a, b) => a - b
  );

  return uniqueTariffs.map((ddvTarifa) => {
    const rows = items.filter((i) => (i.ddv ?? 0) === ddvTarifa);

    const iznosBezDDV = rows.reduce((t, i) => {
      const qty = i.kolicina ?? 0;
      const unit = i.cenaBezDanok ?? 0;
      const pct = (i.rabatProcent ?? 0) / 100;
      return t + qty * unit * (1 - pct);
    }, 0);

    const vkupnoDDV = rows.reduce((t, i) => {
      const qty = i.kolicina ?? 0;
      const unit = i.cenaBezDanok ?? 0;
      const pct = (i.rabatProcent ?? 0) / 100;
      const vat = (i.ddv ?? 0) / 100;

      const lineNet = qty * unit * (1 - pct);
      return t + Math.max(0, lineNet) * vat;
    }, 0);

    const iznosSoDDV = iznosBezDDV + vkupnoDDV;

    return {
      ddvTarifa: ddvTarifa ?? 0,
      iznosBezDDV,
      vkupnoDDV,
      iznosSoDDV,
    };
  });
}
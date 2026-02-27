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
    const pct = (it.rabatProcent ?? 0) / 100;
    const vatRate = (it.ddv ?? 0) / 100;
    const factor = 1 + vatRate;

    const unitGross =
      (it as any).cenaSoDdv && (it as any).cenaSoDdv > 0
        ? (it as any).cenaSoDdv
        : (it.cenaBezDanok ?? 0) * factor;

    const lineGross = qty * unitGross * (1 - pct);

    const lineNet = factor > 0 ? round2(lineGross / factor) : round2(lineGross);
    const lineVat = round2(lineGross - lineNet);

    iznosBezDDV += lineNet;
    vkupnoDDV += lineVat;
  }

  const vkupno = round2(iznosBezDDV + vkupnoDDV);
  return {
    iznosBezDDV: round2(iznosBezDDV),
    vkupnoDDV: round2(vkupnoDDV),
    vkupno,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Summary table grouped by DDV tariff */
export function computeSummaryByDDV(items: InvoiceItem[]): SummaryRow[] {
  const uniqueTariffs = Array.from(new Set(items.map((i) => i.ddv ?? 0))).sort(
    (a, b) => a - b,
  );

  return uniqueTariffs.map((ddvTarifa) => {
    const rows = items.filter((i) => (i.ddv ?? 0) === ddvTarifa);

    let iznosBezDDV = 0;
    let vkupnoDDV = 0;
    let iznosSoDDV = 0;

    for (const it of rows) {
      const qty = it.kolicina ?? 0;
      const pct = (it.rabatProcent ?? 0) / 100;
      const vatRate = (it.ddv ?? 0) / 100;
      const factor = 1 + vatRate;

      const unitGross =
        (it as any).cenaSoDdv && (it as any).cenaSoDdv > 0
          ? (it as any).cenaSoDdv
          : (it.cenaBezDanok ?? 0) * factor;

      // ✅ match table/totals behavior: compute gross, apply discount, then round to 2
      const lineGross = round2(qty * unitGross * (1 - pct));

      // derive net/vat from the rounded gross
      const lineNet = factor > 0 ? round2(lineGross / factor) : lineGross;
      const lineVat = round2(lineGross - lineNet);

      iznosBezDDV += lineNet;
      vkupnoDDV += lineVat;
      iznosSoDDV += lineGross;
    }

    return {
      ddvTarifa: ddvTarifa ?? 0,
      iznosBezDDV: round2(iznosBezDDV),
      vkupnoDDV: round2(vkupnoDDV),
      iznosSoDDV: round2(iznosSoDDV),
    };
  });
}

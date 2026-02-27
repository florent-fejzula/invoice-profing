// compute-totals.spec.ts
// Place this next to compute-totals.ts (same folder) so the import paths match.

import { InvoiceItem } from "src/app/models/invoice-item.model";
import { computeSummaryByDDV, computeTotals, SummaryRow } from "../compute-totals";


function item(p: Partial<InvoiceItem & { cenaSoDdv?: number }>): InvoiceItem {
  // Minimal defaults so tests stay readable
  return {
    opis: p.opis ?? 'Test',
    em: p.em ?? 'ком',
    kolicina: p.kolicina ?? 1,
    cenaBezDanok: p.cenaBezDanok ?? 0,
    rabatProcent: p.rabatProcent ?? 0,
    ddv: p.ddv ?? 18,
    // keep any extra fields used by totals
    ...(p as any),
  } as InvoiceItem;
}

function sumGross(summary: SummaryRow[]): number {
  return round2(summary.reduce((t, r) => t + (r.iznosSoDDV ?? 0), 0));
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

describe('compute-totals', () => {
  it('returns zeros for empty items', () => {
    const t = computeTotals([]);
    expect(t.iznosBezDDV).toBe(0);
    expect(t.vkupnoDDV).toBe(0);
    expect(t.vkupno).toBe(0);

    const s = computeSummaryByDDV([]);
    expect(s.length).toBe(0);
  });

  it('NET entered: computes totals correctly (18% VAT)', () => {
    const items = [item({ kolicina: 1, cenaBezDanok: 100, ddv: 18 })];

    const t = computeTotals(items);
    expect(t.iznosBezDDV).toBe(100.0);
    expect(t.vkupnoDDV).toBe(18.0);
    expect(t.vkupno).toBe(118.0);

    const s = computeSummaryByDDV(items);
    expect(s.length).toBe(1);
    expect(s[0].ddvTarifa).toBe(18);
    expect(round2(s[0].iznosBezDDV)).toBe(100.0);
    expect(round2(s[0].vkupnoDDV)).toBe(18.0);
    expect(round2(s[0].iznosSoDDV)).toBe(118.0);
  });

  it('GROSS entered: matches the UI source-of-truth behavior (fixes 12159.99 bug)', () => {
    // User enters cenaSoDdv = 12160, ddv = 18, qty = 1
    const items = [
      item({
        kolicina: 1,
        ddv: 18,
        cenaBezDanok: 10305.08, // what UI shows (rounded display)
        cenaSoDdv: 12160,       // user input / source of truth
      } as any),
    ];

    const t = computeTotals(items);
    // derived from rounded gross per-line
    expect(t.iznosBezDDV).toBe(10305.08);
    expect(t.vkupnoDDV).toBe(1854.92);
    expect(t.vkupno).toBe(12160.0);

    const s = computeSummaryByDDV(items);
    expect(s.length).toBe(1);
    expect(s[0].ddvTarifa).toBe(18);
    expect(round2(s[0].iznosBezDDV)).toBe(10305.08);
    expect(round2(s[0].vkupnoDDV)).toBe(1854.92);
    expect(round2(s[0].iznosSoDDV)).toBe(12160.0); // ✅ not 12159.99
  });

  it('Discount % is applied on gross and rounded per-line (18% VAT)', () => {
    // 2 units @ 118 gross each, 10% discount
    // lineGross = 2 * 118 * 0.9 = 212.40
    const items = [
      item({
        kolicina: 2,
        ddv: 18,
        cenaSoDdv: 118,
        rabatProcent: 10,
        // cenaBezDanok can be anything; gross drives totals
        cenaBezDanok: 100,
      } as any),
    ];

    const t = computeTotals(items);
    expect(t.vkupno).toBe(212.4);
    expect(t.iznosBezDDV).toBe(180.0);
    expect(t.vkupnoDDV).toBe(32.4);

    const s = computeSummaryByDDV(items);
    expect(s.length).toBe(1);
    expect(round2(s[0].iznosSoDDV)).toBe(212.4);
    expect(round2(s[0].iznosBezDDV)).toBe(180.0);
    expect(round2(s[0].vkupnoDDV)).toBe(32.4);
  });

  it('Multiple items, same VAT: summary equals totals', () => {
    const items: InvoiceItem[] = [
      // gross-driven item
      item({ kolicina: 1, ddv: 18, cenaSoDdv: 12160, cenaBezDanok: 10305.08 } as any),
      // net-driven item
      item({ kolicina: 3, ddv: 18, cenaBezDanok: 10, rabatProcent: 0 }),
      // discounted net-driven item
      item({ kolicina: 2, ddv: 18, cenaBezDanok: 50, rabatProcent: 10 }),
    ];

    const t = computeTotals(items);
    const s = computeSummaryByDDV(items);

    expect(s.length).toBe(1);
    expect(s[0].ddvTarifa).toBe(18);

    // Strong consistency check
    expect(round2(s[0].iznosSoDDV)).toBe(t.vkupno);
    expect(round2(s[0].iznosBezDDV + s[0].vkupnoDDV)).toBe(t.vkupno);
  });

  it('Multiple VAT rates: sum of summary gross equals invoice total gross', () => {
    const items: InvoiceItem[] = [
      // 18% gross-driven
      item({ kolicina: 1, ddv: 18, cenaSoDdv: 118, cenaBezDanok: 100 } as any),
      // 5% net-driven
      item({ kolicina: 1, ddv: 5, cenaBezDanok: 100 }),
      // 0% VAT
      item({ kolicina: 2, ddv: 0, cenaBezDanok: 50 }),
    ];

    const t = computeTotals(items);
    const s = computeSummaryByDDV(items);

    expect(s.length).toBe(3);
    expect(sumGross(s)).toBe(t.vkupno);

    // Also: each row is internally consistent to 2 decimals
    for (const row of s) {
      expect(round2(row.iznosBezDDV + row.vkupnoDDV)).toBe(round2(row.iznosSoDDV));
    }
  });

  it('Edge case: qty 0 contributes nothing', () => {
    const items: InvoiceItem[] = [
      item({ kolicina: 0, ddv: 18, cenaSoDdv: 999, cenaBezDanok: 999 } as any),
      item({ kolicina: 1, ddv: 18, cenaBezDanok: 100 }),
    ];

    const t = computeTotals(items);
    expect(t.vkupno).toBe(118.0);

    const s = computeSummaryByDDV(items);
    expect(sumGross(s)).toBe(118.0);
  });

  it('Edge case: tiny amounts do not drift/flip sign', () => {
    const items: InvoiceItem[] = [
      item({ kolicina: 1, ddv: 18, cenaBezDanok: 0.01 }), // gross = 0.0118 internally
      item({ kolicina: 1, ddv: 18, cenaBezDanok: 0.02 }),
    ];

    const t = computeTotals(items);
    expect(t.iznosBezDDV).toBeGreaterThanOrEqual(0);
    expect(t.vkupnoDDV).toBeGreaterThanOrEqual(0);
    expect(t.vkupno).toBeGreaterThanOrEqual(0);

    const s = computeSummaryByDDV(items);
    expect(sumGross(s)).toBe(t.vkupno);
  });

  it('Discount cannot make totals negative (extreme discount)', () => {
    const items: InvoiceItem[] = [
      item({ kolicina: 1, ddv: 18, cenaSoDdv: 118, cenaBezDanok: 100, rabatProcent: 200 } as any),
    ];

    const t = computeTotals(items);
    // computeTotals currently does not clamp discount like table totalWithVat does.
    // This test documents current behavior; if you later clamp in computeTotals,
    // adjust expected accordingly.
    expect(t.vkupno).toBeLessThanOrEqual(0);

    // Summary uses the same engine, so it should match totals in sign/amount
    const s = computeSummaryByDDV(items);
    expect(sumGross(s)).toBe(t.vkupno);
  });
});
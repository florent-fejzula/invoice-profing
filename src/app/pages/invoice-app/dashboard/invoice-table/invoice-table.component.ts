import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { InvoiceItem } from 'src/app/models/invoice-item.model';

type FieldKey =
  | 'opis'
  | 'em'
  | 'kolicina'
  | 'cenaBezDanok'
  | 'cenaSoDdv'
  | 'rabatProcent'
  | 'ddv';

@Component({
  selector: 'invoice-table',
  templateUrl: './invoice-table.component.html',
  styleUrls: ['./invoice-table.component.scss'],
})
export class InvoiceTableComponent {
  @Input() items: InvoiceItem[] = [];
  @Input() currentFontSize = 12;
  @Input() paddingSize = 5;

  @Input() lockMode = false;

  @Output() remove = new EventEmitter<number>();
  @Output() itemsChange = new EventEmitter<InvoiceItem[]>();
  @Output() addRowRequested = new EventEmitter<void>();

  @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLElement>>;

  private lockedRows = new Set<number>();

  // --- Helpers ---
  private toNumber(v: any): number {
    if (v === null || v === undefined || v === '') return 0;
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  private vatFactor(item: InvoiceItem): number {
    const ddvPct = this.toNumber(item.ddv) / 100;
    return 1 + ddvPct;
  }

  autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  emitItems() {
    this.itemsChange.emit([...this.items]);
  }

  setNumber(
    rowIndex: number,
    field: 'kolicina' | 'cenaBezDanok' | 'cenaSoDdv' | 'rabatProcent' | 'ddv',
    raw: any,
  ) {
    const item = this.items[rowIndex];
    const num = this.toNumber(raw);

    // set the field first
    (item as any)[field] = num;

    const factor = this.vatFactor(item);

    // If user edits NET
    if (field === 'cenaBezDanok') {
      item.cenaBezDanok = this.round2(num);
      item.cenaSoDdv = this.round2(item.cenaBezDanok * factor);
    }

    // If user edits GROSS (source of truth for display totals)
    if (field === 'cenaSoDdv') {
      item.cenaSoDdv = this.round2(num);

      const netExact = factor > 0 ? item.cenaSoDdv / factor : item.cenaSoDdv;
      item.cenaBezDanok = this.round2(netExact); // display only
    }

    // If user edits VAT %
    if (field === 'ddv') {
      const newFactor = this.vatFactor(item);
      const gross = this.toNumber(item.cenaSoDdv);
      const net = this.toNumber(item.cenaBezDanok);

      // If gross exists, keep gross stable (more intuitive)
      if (gross > 0) {
        item.cenaBezDanok = newFactor > 0 ? gross / newFactor : gross;
      } else {
        // otherwise recompute gross from net
        item.cenaSoDdv = this.round2(net * newFactor);
      }
    }

    // Keep displayed gross clean
    item.cenaSoDdv = this.round2(this.toNumber(item.cenaSoDdv));

    this.emitItems();
  }

  // --- Calculations ---

  /** Discount shown in the "Рабат" column (net-based, like before) */
  discountValue(item: InvoiceItem): number {
    const qty = this.toNumber(item.kolicina);
    const priceNet = this.toNumber(item.cenaBezDanok);

    const fixed = this.toNumber(item.rabat);
    if (fixed > 0) return fixed;

    const pct = this.toNumber(item.rabatProcent) / 100;
    return qty * priceNet * pct;
  }

  /**
   * Line total WITH VAT.
   * ✅ If user provided cenaSoDdv, we use it as the unit gross to avoid 12159.99 issues.
   */
  totalWithVat(item: InvoiceItem): number {
    const qty = this.toNumber(item.kolicina);
    const pct = this.toNumber(item.rabatProcent) / 100;
    const factor = this.vatFactor(item);

    const unitGross =
      this.toNumber(item.cenaSoDdv) > 0
        ? this.toNumber(item.cenaSoDdv)
        : this.toNumber(item.cenaBezDanok) * factor;

    const lineGross = qty * unitGross;
    const lineAfterDiscount = Math.max(0, lineGross * (1 - pct));

    return this.round2(lineAfterDiscount);
  }

  // --- Lock/edit mode ---
  toggleLock(i: number) {
    if (this.lockedRows.has(i)) this.lockedRows.delete(i);
    else this.lockedRows.add(i);
  }

  isLocked(i: number) {
    return this.lockMode && this.lockedRows.has(i);
  }

  // --- Keyboard behavior ---
  private fieldOrder: FieldKey[] = [
    'opis',
    'em',
    'kolicina',
    'cenaBezDanok',
    'cenaSoDdv',
    'rabatProcent',
    'ddv',
  ];

  handleEnter(rowIndex: number, field: FieldKey, ev: Event) {
    const kev = ev as KeyboardEvent;
    kev.preventDefault();

    const idx = this.fieldOrder.indexOf(field);
    const isLastField = idx === this.fieldOrder.length - 1;

    if (isLastField) {
      this.addRowRequested.emit();
      return;
    }

    const nextField = this.fieldOrder[idx + 1];
    this.focusCell(rowIndex, nextField);
  }

  focusCell(rowIndex: number, field: FieldKey) {
    const el = this.findCellInput(rowIndex, field);
    if (!el) return;

    (el as any).focus?.();
    (el as any).select?.();
  }

  private findCellInput(rowIndex: number, field: FieldKey): HTMLElement | null {
    const list = this.cellInputs?.toArray() ?? [];
    for (const ref of list) {
      const el = ref.nativeElement;
      const r = Number(el.getAttribute('data-row'));
      const f = el.getAttribute('data-field') as FieldKey | null;
      if (r === rowIndex && f === field) return el;
    }
    return null;
  }

  format2(rowIndex: number, field: 'cenaBezDanok' | 'cenaSoDdv') {
    const item = this.items[rowIndex];
    const v = this.toNumber((item as any)[field]);
    (item as any)[field] = this.round2(v);
    this.emitItems();
  }
}

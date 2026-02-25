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

  // Optional: enable from dashboard later with [lockMode]="true"
  @Input() lockMode = false;

  @Output() remove = new EventEmitter<number>();
  @Output() itemsChange = new EventEmitter<InvoiceItem[]>();
  @Output() addRowRequested = new EventEmitter<void>();

  @ViewChildren('cellInput') cellInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  private lockedRows = new Set<number>();

  emitItems() {
    // emit new reference so parent updates reliably
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

    // sync logic
    const ddvPct = this.toNumber(item.ddv) / 100;
    const factor = 1 + ddvPct;

    if (field === 'cenaBezDanok') {
      item.cenaBezDanok = this.round2(num);
      item.cenaSoDdv = this.round2(item.cenaBezDanok * factor);
    }

    if (field === 'cenaSoDdv') {
      item.cenaSoDdv = this.round2(num);
      item.cenaBezDanok =
        factor > 0
          ? this.round2(item.cenaSoDdv / factor)
          : this.round2(item.cenaSoDdv);
    }

    if (field === 'ddv') {
      const gross = this.toNumber(item.cenaSoDdv);

      if (gross > 0) {
        const newFactor = 1 + this.toNumber(item.ddv) / 100;
        item.cenaBezDanok =
          newFactor > 0 ? this.round2(gross / newFactor) : this.round2(gross);
      } else {
        const net = this.toNumber(item.cenaBezDanok);
        const newFactor = 1 + this.toNumber(item.ddv) / 100;
        item.cenaSoDdv = this.round2(net * newFactor);
      }
    }

    this.emitItems();
  }

  private toNumber(v: any): number {
    if (v === null || v === undefined || v === '') return 0;
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  // --- Calculations ---
  discountValue(item: InvoiceItem): number {
    const qty = this.toNumber(item.kolicina);
    const price = this.toNumber(item.cenaBezDanok);

    // If you ever use fixed discount (item.rabat), it will take precedence
    const fixed = this.toNumber(item.rabat);
    if (fixed > 0) return fixed;

    const pct = this.toNumber(item.rabatProcent) / 100;
    return qty * price * pct;
  }

  totalWithVat(item: InvoiceItem): number {
    const qty = this.toNumber(item.kolicina);
    const price = this.toNumber(item.cenaBezDanok);
    const ddv = this.toNumber(item.ddv) / 100;

    const gross = qty * price;
    const discount = this.discountValue(item);
    const net = Math.max(0, gross - discount);

    return net + net * ddv;
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

  // Exposed API: dashboard can call this after addRow()
  focusCell(rowIndex: number, field: FieldKey) {
    const el = this.findCellInput(rowIndex, field);
    if (!el) return;
    el.focus();
    el.select?.();
  }

  private findCellInput(
    rowIndex: number,
    field: FieldKey,
  ): HTMLInputElement | null {
    const list = this.cellInputs?.toArray() ?? [];
    for (const ref of list) {
      const el = ref.nativeElement;
      const r = Number(el.getAttribute('data-row'));
      const f = el.getAttribute('data-field') as FieldKey | null;
      if (r === rowIndex && f === field) return el;
    }
    return null;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }
}

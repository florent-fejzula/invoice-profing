import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InvoiceItem } from 'src/app/models/invoice-item.model';

@Component({
  selector: 'invoice-table',
  templateUrl: './invoice-table.component.html',
  styleUrls: ['./invoice-table.component.scss'],
})
export class InvoiceTableComponent {
  @Input() items: InvoiceItem[] = [];
  @Input() currentFontSize = 12;
  @Input() paddingSize = 5;

  @Output() remove = new EventEmitter<number>();
  @Output() edit = new EventEmitter<InvoiceItem>();

  // helpers are UI-only; parent still does recompute/save
  cenaSoPresmetanRabat(item: InvoiceItem): number {
    const popustVrednost = (item.cenaBezDanok * (item.rabatProcent ?? 0)) / 100;
    return popustVrednost;
  }

  cenaSoDDV(item: InvoiceItem) {
    const cenaSoPresmetanRabat =
      item.kolicina * item.cenaBezDanok * (1 - (item.rabatProcent ?? 0) / 100);
    const iznosDDV = cenaSoPresmetanRabat * ((item.ddv ?? 0) / 100);
    return cenaSoPresmetanRabat + iznosDDV;
  }
}

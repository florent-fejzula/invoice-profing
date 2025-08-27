import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SummaryRow } from 'src/app/utils/compute-totals';

@Component({
  selector: 'invoice-totals',
  templateUrl: './invoice-totals.component.html',
  styleUrls: ['./invoice-totals.component.scss'],
})
export class InvoiceTotalsComponent {
  // (you may not be using these two here, but keep for parity)
  @Input() showTaxCategories = false;
  @Input() summaryData: SummaryRow[] = [];

  @Input() vkupenIznosBezDDV = 0;
  @Input() vkupnoDDV = 0;

  // ---- fields you bind in dashboard.html
  @Input() slobodenOpis = '';
  @Output() slobodenOpisChange = new EventEmitter<string>();

  @Input() soZborovi = '';
  @Output() soZboroviChange = new EventEmitter<string>();

  @Input() napomena = '';
  @Output() napomenaChange = new EventEmitter<string>();

  @Input() isNoteVisible = true;
  @Output() toggleNoteVisibility = new EventEmitter<void>();

  onSlobodenOpis(v: string) { this.slobodenOpisChange.emit(v); }
  onSoZborovi(v: string)    { this.soZboroviChange.emit(v); }
  onNapomena(v: string)     { this.napomenaChange.emit(v); }
}

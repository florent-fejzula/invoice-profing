import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface InvoiceMetaData {
  datum: Date;
  valuta: Date;
  fakturaTip: string;
  fakturaBroj?: string;
}

@Component({
  selector: 'app-invoice-meta-modal',
  templateUrl: './invoice-meta-modal.component.html',
  styleUrls: ['./invoice-meta-modal.component.scss'],
})
export class InvoiceMetaModalComponent {
  datum: Date = new Date();
  valuta: Date = new Date();
  fakturaTip = 'Фактура';
  fakturaBroj = '';
  presetTips: string[] = ['Фактура', 'Профактура', 'Авансна Фактура', 'Понуда'];

  constructor(
    public dialogRef: MatDialogRef<InvoiceMetaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoiceMetaData
  ) {
    // seed from parent
    this.datum = data?.datum ? new Date(data.datum) : new Date();
    this.valuta = data?.valuta ? new Date(data.valuta) : new Date();
    this.fakturaTip = data?.fakturaTip ?? 'Фактура';
    this.fakturaBroj = data?.fakturaBroj ?? '';
  }

  onDateChange(event: any, prop: 'datum' | 'valuta'): void {
    const d: Date | null = event?.value ?? null;
    if (d) (this as any)[prop] = d;
  }

  /** ask parent to allocate a number now */
  requestNumber(): void {
    this.dialogRef.close({ requestNumber: true });
  }

  onTipSelected(v: string) {
    this.fakturaTip = v; // keeps ngModel in sync
  }

  onSaveClick(): void {
    this.dialogRef.close({
      datum: this.datum,
      valuta: this.valuta,
      fakturaTip: this.fakturaTip,
      fakturaBroj: this.fakturaBroj?.trim() || undefined,
    } as Partial<InvoiceMetaData>);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

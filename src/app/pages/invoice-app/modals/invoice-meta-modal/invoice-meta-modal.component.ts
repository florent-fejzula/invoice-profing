import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface InvoiceMetaData {
  datum: Date;
  valuta: Date;
  fakturaTip: string;
  fakturaBroj?: string;
  companyCity?: string;
}

@Component({
  selector: 'app-invoice-meta-modal',
  templateUrl: './invoice-meta-modal.component.html',
  styleUrls: ['./invoice-meta-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class InvoiceMetaModalComponent {
  datum: Date = new Date();
  valuta: Date = new Date();
  fakturaTip = '';
  fakturaBroj = '';
  companyCity = '';

  /** lock number input once already allocated */
  get isAllocated() {
    return !!this.fakturaBroj?.trim();
  }

  constructor(
    public dialogRef: MatDialogRef<InvoiceMetaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoiceMetaData
  ) {
    // seed from parent
    this.datum = data?.datum ? new Date(data.datum) : new Date();
    this.valuta = data?.valuta ? new Date(data.valuta) : new Date();
    this.fakturaTip = data?.fakturaTip ?? '';
    this.fakturaBroj = data?.fakturaBroj ?? '';
    this.companyCity = data?.companyCity ?? '';
  }

  onDateChange(event: any, prop: 'datum' | 'valuta'): void {
    const d: Date | null = event?.value ?? null;
    if (d) (this as any)[prop] = d;
  }

  /** ask parent to allocate a number now */
  requestNumber(): void {
    this.dialogRef.close({ requestNumber: true });
  }

  onSaveClick(): void {
    this.dialogRef.close({
      datum: this.datum,
      valuta: this.valuta,
      fakturaTip: this.fakturaTip,
      fakturaBroj: this.fakturaBroj || undefined, // keep empty as undefined
      companyCity: this.companyCity || undefined,
    } as Partial<InvoiceMetaData>);
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

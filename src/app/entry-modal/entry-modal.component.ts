import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InvoiceItem } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-entry-modal',
  templateUrl: './entry-modal.component.html',
  styleUrls: ['./entry-modal.component.scss'],
})
export class EntryModalComponent {
  originalItem: InvoiceItem;
  editedItem: InvoiceItem;

  opis = '';
  em = '';
  kolicina!: number;
  cenaBezDanok!: number;
  rabatProcent!: number;
  rabat!: number;
  ddv!: number;
  iznosSoDDV!: number;

  constructor(
    public dialogRef: MatDialogRef<EntryModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: InvoiceItem }
  ) {
    this.originalItem = { ...data.item };
    this.editedItem = { ...data.item };
  }

  onSaveClick(): void {
    // Check if this.editedItem.ddv is defined before attempting to convert it to a string
    const ddvString =
      this.editedItem.ddv !== undefined ? this.editedItem.ddv.toString() : '0';

    this.dialogRef.close({
      newItem: {
        opis: this.editedItem.opis,
        em: this.editedItem.em || 'ком',
        kolicina: this.editedItem.kolicina || 1,
        cenaBezDanok: this.editedItem.cenaBezDanok || 0,
        rabatProcent: this.editedItem.rabatProcent || 0,
        rabat: this.editedItem.rabat,
        ddv: ddvString, // Use the converted string or '0' if this.editedItem.ddv is undefined
        iznosSoDDV: this.editedItem.iznosSoDDV,
      },
    });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

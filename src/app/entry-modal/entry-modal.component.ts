import { Component, Inject } from '@angular/core';
import { EntryService } from '../entry.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { InvoiceItem } from '../app.component';

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
    @Inject(MAT_DIALOG_DATA) public data: { item: InvoiceItem },
    private entryService: EntryService
  ) {
    console.log('Modal, data: ', this.data);

    // this.item = data.item || {};
    this.originalItem = { ...data.item };
    this.editedItem = { ...data.item };

    console.log('Modal, item: ', this.data.item);
  }

  // onSaveClick(): void {
  //   this.entryService.opis = this.item.opis;
  //   this.entryService.em = this.item.em;
  //   this.entryService.kolicina = this.item.kolicina;
  //   this.entryService.cenaBezDanok = this.item.cenaBezDanok;
  //   this.entryService.rabatProcent = this.item.rabatProcent;
  //   this.entryService.rabat = this.item.rabat;
  //   this.entryService.ddv = this.item.ddv;
  //   this.entryService.iznosSoDDV = this.item.iznosSoDDV;
  //   this.dialogRef.close({
  //     newItem: {
  //       opis: this.item.opis,
  //       em: this.item.em || 'ком',
  //       kolicina: this.item.kolicina || 1,
  //       cenaBezDanok: this.item.cenaBezDanok,
  //       rabatProcent: this.item.rabatProcent || 0,
  //       rabat: this.item.rabat,
  //       ddv: this.item.ddv || 0,
  //       iznosSoDDV: this.item.iznosSoDDV,
  //     },
  //   });
  // }

  onSaveClick(): void {
    this.dialogRef.close({
      newItem: {
        opis: this.editedItem.opis,
        em: this.editedItem.em || 'ком',
        kolicina: this.editedItem.kolicina || 1,
        cenaBezDanok: this.editedItem.cenaBezDanok,
        rabatProcent: this.editedItem.rabatProcent || 0,
        rabat: this.editedItem.rabat,
        ddv: this.editedItem.ddv || 0,
        iznosSoDDV: this.editedItem.iznosSoDDV,
      },
    });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

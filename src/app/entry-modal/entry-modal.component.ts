import { Component } from '@angular/core';
import { EntryService } from '../entry.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-entry-modal',
  templateUrl: './entry-modal.component.html',
  styleUrls: ['./entry-modal.component.scss'],
})
export class EntryModalComponent {
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
    private entryService: EntryService
  ) {}

  onSaveClick(): void {
    if (!this.opis) return;

    this.entryService.opis = this.opis;
    this.entryService.em = this.em;
    this.entryService.kolicina = this.kolicina;
    this.entryService.cenaBezDanok = this.cenaBezDanok;
    this.entryService.rabatProcent = this.rabatProcent;
    this.entryService.rabat = this.rabat;
    this.entryService.ddv = this.ddv;
    this.entryService.iznosSoDDV = this.iznosSoDDV;
    this.dialogRef.close({
      newItem: {
        opis: this.opis,
        em: this.em,
        kolicina: this.kolicina,
        cenaBezDanok: this.cenaBezDanok,
        rabatProcent: this.rabatProcent,
        rabat: this.rabat,
        ddv: this.ddv,
        iznosSoDDV: this.iznosSoDDV,
      },
    });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

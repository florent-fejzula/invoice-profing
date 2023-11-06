import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditModalComponent } from './edit-modal/edit-modal.component';
import { DataService } from './data.service';
import { EntryModalComponent } from './entry-modal/entry-modal.component';

interface InvoiceItem {
  opis: string;
  em: string;
  kolicina: number;
  cenaBezDanok: number;
  rabatProcent: number;
  rabat: number;
  ddv: number;
  iznosSoDDV: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  datum = new Date();
  valuta = new Date();
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';

  soZborovi = '';

  items: InvoiceItem[] = [];

  constructor(private dialog: MatDialog, private dataService: DataService) {}

  openEditModal(): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.datum = this.dataService.datum;
      this.valuta = this.dataService.valuta;
      this.fakturaBroj = this.dataService.fakturaBroj;
      this.companyTitle = this.dataService.companyTitle;
      this.companyAddress = this.dataService.companyAddress;
      this.companyCity = this.dataService.companyCity;
      this.companyID = this.dataService.companyID;
    });
  }

  openEntryModal(): void {
    const dialogRef = this.dialog.open(EntryModalComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((data: any) => {
      if (data && data.newItem) {
        const newItem = data.newItem;
        this.items.push(newItem);
      }
    });
  }

  calculateItemTotal(item: any) {
    const price = item.cenaBezDanok * (1 - item.rabatProcent / 100);
    const taxAmount = price * (item.ddv / 100);
    return price + taxAmount;
  }

  printThisPage() {
    window.print();
  }
}

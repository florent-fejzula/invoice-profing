import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditModalComponent } from './edit-modal/edit-modal.component';
import { DataService } from './data.service';
import { EntryModalComponent } from './entry-modal/entry-modal.component';

export interface InvoiceItem {
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
export class AppComponent implements OnInit {
  datum = new Date();
  valuta = new Date();
  selectedOption = '';
  fakturaTip = '';
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';
  slobodenOpis = '';

  vkupenIznosBezDDV: number = 0;
  vkupnoDDV: number = 0;

  summaryData: {
    ddvTarifa: number;
    iznosBezDDV: number;
    vkupnoDDV: number;
    iznosSoDDV: number;
  }[] = [];

  soZborovi = '';

  items: InvoiceItem[] = [];

  constructor(private dialog: MatDialog, private dataService: DataService) {}

  ngOnInit() {
    this.calculateSummaryData();
  }

  openEditModal(): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(() => {
      this.datum = this.dataService.datum;
      this.valuta = this.dataService.valuta;
      this.selectedOption = this.dataService.selectedOption;
      this.fakturaTip = this.dataService.fakturaTip;
      this.fakturaBroj = this.dataService.fakturaBroj;
      this.companyTitle = this.dataService.companyTitle;
      this.companyAddress = this.dataService.companyAddress;
      this.companyCity = this.dataService.companyCity;
      this.companyID = this.dataService.companyID;
      this.slobodenOpis = this.dataService.slobodenOpis;
    });
  }

  openEntryModal(item?: InvoiceItem): void {
    console.log('item: ', item);

    const dialogRef = this.dialog.open(EntryModalComponent, {
      width: '400px',
      data: { item },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((data: any) => {
      if (data && data.newItem) {
        var newItem = data.newItem;
        if (item) {
          const index = this.items.indexOf(item);
          if (index !== -1) {
            this.items[index] = newItem;
          }
        } else {
          this.items.push(newItem);
        }
        this.calculateSummaryData();
        this.updateVkupenIznosBezDDV();
        this.updateVkupnoDDV();
      }
    });
  }

  cenaSoPresmetanRabat(item: any): number {
    const cenaBezDanok = item.cenaBezDanok;
    const rabatProcent = item.rabatProcent;

    const popustVrednost = (cenaBezDanok * rabatProcent) / 100;
    return popustVrednost;
  }

  cenaSoDDV(item: any) {
    const cenaSoPresmetanRabat =
      item.kolicina * item.cenaBezDanok * (1 - item.rabatProcent / 100);
    const iznosDDV = cenaSoPresmetanRabat * (item.ddv / 100);
    return cenaSoPresmetanRabat + iznosDDV;
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.calculateSummaryData();
      this.updateVkupenIznosBezDDV();
      this.updateVkupnoDDV();
    }
  }

  // calculateSummaryData() {
  //   const unikatniDDV = Array.from(new Set(this.items.map((item) => item.ddv)));

  //   this.summaryData = unikatniDDV.map((ddvTarifa) => {
  //     const itemsWithTariff = this.items.filter(
  //       (item) => item.ddv === ddvTarifa
  //     );
  //     const iznosBezDDV = itemsWithTariff.reduce(
  //       (total, item) => total + Number(item.cenaBezDanok) * item.kolicina,
  //       0
  //     );
  //     const vkupnoDDV = itemsWithTariff.reduce(
  //       (total, item) =>
  //         total + (item.cenaBezDanok * ddvTarifa * item.kolicina) / 100,
  //       0
  //     );
  //     const iznosSoDDV = Number(iznosBezDDV) + Number(vkupnoDDV);

  //     return { ddvTarifa, iznosBezDDV, vkupnoDDV, iznosSoDDV };
  //   });
  // }

  calculateSummaryData() {
    const unikatniDDV = Array.from(new Set(this.items.map((item) => item.ddv)));
  
    this.summaryData = unikatniDDV.map((ddvTarifa) => {
      const itemsWithTariff = this.items.filter((item) => item.ddv === ddvTarifa);
      const iznosBezDDV = itemsWithTariff.reduce(
        (total, item) => total + Number(item.cenaBezDanok * item.kolicina),
        0
      );
      const vkupnoDDV = itemsWithTariff.reduce(
        (total, item) =>
          total + (item.cenaBezDanok * ddvTarifa * item.kolicina * (1 - item.rabatProcent / 100)) / 100,
        0
      );
      const iznosSoDDV = Number(iznosBezDDV) + Number(vkupnoDDV);
  
      return { ddvTarifa, iznosBezDDV, vkupnoDDV, iznosSoDDV };
    });
  }

  updateVkupenIznosBezDDV() {
    this.vkupenIznosBezDDV = this.items.reduce((total, item) => {
      const priceWithDiscount =
        item.cenaBezDanok * (1 - item.rabatProcent / 100);
      return total + priceWithDiscount * item.kolicina;
    }, 0);
  }

  updateVkupnoDDV() {
    this.vkupnoDDV = this.items.reduce((total, item) => {
      const discountedPrice = item.cenaBezDanok * (1 - item.rabatProcent / 100);
      const taxAmount = (discountedPrice * item.ddv / 100) * item.kolicina;
      return total + taxAmount;
    }, 0);
  }

  printThisPage() {
    window.print();
  }
}

import { Component, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
  datum = new Date();
  valuta = new Date();
  selectedOption = '';
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';
  slobodenOpis = '';

  totalPriceWithoutTax: number = 0;
  totalTax: number = 0;

  summaryData: {
    tariff: number;
    totalWithoutTax: number;
    totalTax: number;
    totalWithTax: number;
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
      this.fakturaBroj = this.dataService.fakturaBroj;
      this.companyTitle = this.dataService.companyTitle;
      this.companyAddress = this.dataService.companyAddress;
      this.companyCity = this.dataService.companyCity;
      this.companyID = this.dataService.companyID;
      this.slobodenOpis = this.dataService.slobodenOpis;
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
        this.calculateSummaryData();
        this.updateTotalPriceWithoutTax();
        this.updateTotalTax();
      }
    });
  }

  calculateRabat(item: any): number {
    if (
      item &&
      item.cenaBezDanok !== undefined &&
      item.rabatProcent !== undefined
    ) {
      const price = item.cenaBezDanok;
      const discountPercentage = item.rabatProcent;

      if (price >= 0 && discountPercentage >= 0 && discountPercentage <= 100) {
        const discountAmount = (price * discountPercentage) / 100;
        return discountAmount;
      } else {
        // Handle invalid inputs (negative price or discount out of range)
        console.error(
          'Invalid inputs: price and discount must be non-negative, and discount must be between 0 and 100.'
        );
        return 0;
      }
    } else {
      // Handle missing or undefined item, price, or discount
      console.error(
        'Invalid input: item, price, and discount must be defined.'
      );
      return 0;
    }
  }

  calculateItemTotal(item: any) {
    const price = item.cenaBezDanok * (1 - item.rabatProcent / 100);
    const taxAmount = price * (item.ddv / 100);
    return price + taxAmount;
  }

  removeItem(index: number): void {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.calculateSummaryData();
      this.updateTotalPriceWithoutTax();
      this.updateTotalTax();
    }
  }

  calculateSummaryData() {
    const uniqueTariffs = Array.from(
      new Set(this.items.map((item) => item.ddv))
    );

    this.summaryData = uniqueTariffs.map((tariff) => {
      const itemsWithTariff = this.items.filter((item) => item.ddv === tariff);
      const totalWithoutTax = itemsWithTariff.reduce(
        (total, item) => total + Number(item.cenaBezDanok),
        0
      );
      const totalTax = itemsWithTariff.reduce(
        (total, item) => total + (item.cenaBezDanok * tariff) / 100,
        0
      );
      const totalWithTax = Number(totalWithoutTax) + Number(totalTax);

      return { tariff, totalWithoutTax, totalTax, totalWithTax };
    });
  }

  updateTotalPriceWithoutTax() {
    this.totalPriceWithoutTax = this.items.reduce((total, item) => {
      const priceWithDiscount =
        item.cenaBezDanok * (1 - item.rabatProcent / 100);
      return total + priceWithDiscount;
    }, 0);
  }

  updateTotalTax() {
    this.totalTax = this.items.reduce((total, item) => {
      const taxAmount = (item.cenaBezDanok * item.ddv) / 100;
      return total + taxAmount;
    }, 0);
  }

  printThisPage() {
    window.print();
  }
}

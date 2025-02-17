import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from 'src/environments/environment.interface';
import { DataService } from '../services/data.service';
import { environment } from 'src/environments/environment';
import { EditModalComponent } from '../edit-modal/edit-modal.component';
import { EntryModalComponent } from '../entry-modal/entry-modal.component';
import { ExportService } from '../services/export.service';
import { FileSaveDialogComponent } from '../file-save-dialog/file-save-dialog.component';
import { CompanyService } from '../services/company.service';

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
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  environment: Environment = environment;

  company: any;

  currentFontSize = 12;
  paddingSize = 5;

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
  napomena = '';

  vkupenIznosBezDDV: number = 0;
  vkupnoDDV: number = 0;

  isNoteVisible: boolean = true;

  summaryData: {
    ddvTarifa: number;
    iznosBezDDV: number;
    vkupnoDDV: number;
    iznosSoDDV: number;
  }[] = [];

  soZborovi = '';
  exportFileName: string = 'exported-data.json'; // Default file name

  items: InvoiceItem[] = [];

  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    private exportService: ExportService,
    private companyService: CompanyService
  ) {}

  ngOnInit() {
    this.companyService.getCompany().subscribe((data) => {
      this.company = data;
    });
    this.calculateSummaryData();
  }

  exportToJson(): void {
    const textareaValue = (
      document.querySelector('textarea') as HTMLTextAreaElement
    ).value;

    const dataToExport = {
      datum: this.datum,
      valuta: this.valuta,
      selectedOption: this.selectedOption,
      fakturaTip: this.fakturaTip,
      fakturaBroj: this.fakturaBroj,
      companyTitle: this.companyTitle,
      companyAddress: this.companyAddress,
      companyCity: this.companyCity,
      companyID: this.companyID,
      slobodenOpis: this.slobodenOpis,
      textareaValue: textareaValue,
      napomena: this.napomena,
      vkupenIznosBezDDV: this.vkupenIznosBezDDV,
      vkupnoDDV: this.vkupnoDDV,
      soZborovi: this.soZborovi,
      items: this.items,
    };

    const dialogRef = this.dialog.open(FileSaveDialogComponent, {
      width: '300px',
      data: { fileName: this.exportFileName },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.exportFileName = result;
        this.exportService.exportToJsonFile(dataToExport, this.exportFileName);
      }
    });
  }

  importJson(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const importedData = JSON.parse(reader.result as string);

        this.datum = new Date(importedData.datum);
        this.valuta = new Date(importedData.valuta);
        this.selectedOption = importedData.selectedOption;
        this.fakturaTip = importedData.fakturaTip;
        this.fakturaBroj = importedData.fakturaBroj;
        this.companyTitle = importedData.companyTitle;
        this.companyAddress = importedData.companyAddress;
        this.companyCity = importedData.companyCity;
        this.companyID = importedData.companyID;
        this.slobodenOpis = importedData.slobodenOpis;
        const textareaValue = importedData.textareaValue;
        (document.querySelector('textarea') as HTMLTextAreaElement).value =
          textareaValue;
        this.napomena = importedData.napomena;
        this.vkupenIznosBezDDV = importedData.vkupenIznosBezDDV;
        this.vkupnoDDV = importedData.vkupnoDDV;
        this.soZborovi = importedData.soZborovi;
        this.items = importedData.items;
      };

      reader.readAsText(file);
    }
  }

  openEditModal(): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
      width: '400px',
      data: {
        datum: this.datum,
        valuta: this.valuta,
        fakturaTip: this.fakturaTip,
        fakturaBroj: this.fakturaBroj,
        companyTitle: this.companyTitle,
        companyAddress: this.companyAddress,
        companyCity: this.companyCity,
        companyID: this.companyID,
        slobodenOpis: this.slobodenOpis,
      },
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
    const dialogRef = this.dialog.open(EntryModalComponent, {
      width: '400px',
      data: { item },
      disableClose: true,
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
      const itemsWithTariff = this.items.filter(
        (item) => item.ddv === ddvTarifa
      );
      const iznosBezDDV = itemsWithTariff.reduce(
        (total, item) => total + Number(item.cenaBezDanok * item.kolicina),
        0
      );
      const vkupnoDDV = itemsWithTariff.reduce(
        (total, item) =>
          total +
          (item.cenaBezDanok *
            ddvTarifa *
            item.kolicina *
            (1 - item.rabatProcent / 100)) /
            100,
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
      const taxAmount = ((discountedPrice * item.ddv) / 100) * item.kolicina;
      return total + taxAmount;
    }, 0);
  }

  increaseFontSize(): void {
    this.currentFontSize++;
  }

  decreaseFontSize(): void {
    this.currentFontSize--;
  }

  adjustPaddingSize(): void {
    this.paddingSize = this.currentFontSize / 5; // Adjust padding size according to your preference
  }

  toggleNoteVisibility() {
    this.isNoteVisible = !this.isNoteVisible; // Toggle the visibility
  }

  printThisPage() {
    window.print();
  }
}

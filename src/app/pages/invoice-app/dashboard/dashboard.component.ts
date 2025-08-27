import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from 'src/environments/environment.interface';
import { environment } from 'src/environments/environment';

import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { InvoicesService } from 'src/app/services/invoices.service';

import { EntryModalComponent } from '../modals/entry-modal/entry-modal.component';
import { EditModalComponent } from '../modals/edit-modal/edit-modal.component';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

import { InvoiceItem } from 'src/app/models/invoice-item.model';
import {
  computeTotals,
  computeSummaryByDDV,
  SummaryRow,
} from 'src/app/utils/compute-totals';

import { InvoiceHeaderState } from './invoice-header/invoice-header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  environment: Environment = environment;

  company: any;
  user: any = null;

  // TEMP: replace with real ID from CompanyService
  companyId = 'GLp2xLv3ZzX6ktQZUsyU';

  // consolidated header
  header: InvoiceHeaderState = {
    datum: new Date(),
    valuta: new Date(),
    fakturaTip: '',
    fakturaBroj: '',
    companyTitle: '',
    companyAddress: '',
    companyCity: '',
    companyID: '',
  };

  currentFontSize = 12;
  paddingSize = 5;

  slobodenOpis = '';
  napomena = '';

  vkupenIznosBezDDV = 0;
  vkupnoDDV = 0;

  isNoteVisible = true;
  soZborovi = '';
  exportFileName = 'exported-data.json';

  summaryData: SummaryRow[] = [];
  items: InvoiceItem[] = [];

  constructor(
    private auth: Auth,
    private router: Router,
    private dialog: MatDialog,
    private dataService: DataService,
    private companyService: CompanyService,
    private invoicesSvc: InvoicesService
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => (this.user = user));

    this.companyService.getCompany().subscribe((data) => {
      this.company = data;
    });

    this.recompute();
  }

  // child event handler
  onHeaderChange(patch: Partial<InvoiceHeaderState>) {
    this.header = { ...this.header, ...patch };
  }

  /** ---------- FILE IMPORT / EXPORT ---------- */
  async exportToJson(): Promise<void> {
    const dataToExport = {
      ...this.header,
      slobodenOpis: this.slobodenOpis,
      napomena: this.napomena,
      vkupenIznosBezDDV: this.vkupenIznosBezDDV,
      vkupnoDDV: this.vkupnoDDV,
      soZborovi: this.soZborovi,
      items: this.items,
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);

    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: 'invoice_data.json',
          types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        };
        // @ts-ignore
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
      } catch (error) {
        console.error('File save cancelled or failed:', error);
      }
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  importJson(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);

        this.header = {
          datum: new Date(imported.datum),
          valuta: new Date(imported.valuta),
          fakturaTip: imported.fakturaTip,
          fakturaBroj: imported.fakturaBroj,
          companyTitle: imported.companyTitle,
          companyAddress: imported.companyAddress,
          companyCity: imported.companyCity,
          companyID: imported.companyID,
        };

        this.slobodenOpis = imported.slobodenOpis;
        this.napomena = imported.napomena;
        this.soZborovi = imported.soZborovi;
        this.items = imported.items || [];

        this.recompute();
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    };

    reader.readAsText(file);
  }

  /** ---------- MODALS ---------- */
  openEditModal(): void {
    const dialogRef = this.dialog.open(EditModalComponent, {
      width: '400px',
      data: { ...this.header },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.header = {
        datum: this.dataService.datum,
        valuta: this.dataService.valuta,
        fakturaTip: this.dataService.fakturaTip,
        fakturaBroj: this.dataService.fakturaBroj,
        companyTitle: this.dataService.companyTitle,
        companyAddress: this.dataService.companyAddress,
        companyCity: this.dataService.companyCity,
        companyID: this.dataService.companyID,
      };
    });
  }

  openEntryModal(item?: InvoiceItem): void {
    const dialogRef = this.dialog.open(EntryModalComponent, {
      width: '400px',
      data: { item },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((data: any) => {
      if (!data || !data.newItem) return;
      const newItem = data.newItem as InvoiceItem;

      if (item) {
        const index = this.items.indexOf(item);
        if (index !== -1) this.items[index] = newItem;
      } else {
        this.items.push(newItem);
      }

      this.recompute();
    });
  }

  removeItem(index: number): void {
    if (index < 0 || index >= this.items.length) return;
    this.items.splice(index, 1);
    this.recompute();
  }

  /** ---------- CALC ---------- */
  private recompute() {
    this.summaryData = computeSummaryByDDV(this.items);
    const t = computeTotals(this.items);
    this.vkupenIznosBezDDV = t.iznosBezDDV;
    this.vkupnoDDV = t.vkupnoDDV;
  }

  /** ---------- SAVE TO CLOUD ---------- */
  async saveToFirestore() {
    if (!this.user) return;

    let broj = this.header.fakturaBroj || '';
    let seq = 0, year = new Date().getFullYear(), month = new Date().getMonth() + 1;

    try {
      const alloc = await this.invoicesSvc.allocateNumberTx(this.companyId);
      broj = alloc.broj;
      seq = alloc.seq;
      year = alloc.year;
      month = alloc.month;
      this.header.fakturaBroj = broj;
    } catch (err) {
      console.error('❌ Number allocation failed:', err);
      if (!broj) return;
    }

    const t = computeTotals(this.items);

    try {
      await this.invoicesSvc.create(this.companyId, {
        companyId: this.companyId,
        broj, seq, year, month,
        status: 'draft',
        datumIzdavanje: this.header.datum?.getTime?.() ?? new Date(this.header.datum).getTime(),
        datumValuta: this.header.valuta
          ? this.header.valuta.getTime?.() ?? new Date(this.header.valuta).getTime()
          : undefined,
        klientIme: this.header.companyTitle || '',
        klientEDB: this.header.companyID || '',
        klientAdresa: `${this.header.companyAddress ?? ''} ${this.header.companyCity ?? ''}`.trim(),
        klientEmail: '',
        klientTelefon: '',
        valuta: 'MKD',
        stavki: this.items,
        iznosBezDDV: t.iznosBezDDV,
        ddvVkupno: t.vkupnoDDV,
        vkupno: t.vkupno,
        zabeleshka: this.napomena || '',
        createdByUid: this.user.uid,
      });

      console.log('✅ Invoice saved to Firestore with broj:', broj);
    } catch (err) {
      console.error('❌ Failed saving invoice:', err);
    }
  }

  /** ---------- UI misc ---------- */
  increaseFontSize(): void { this.currentFontSize++; }
  decreaseFontSize(): void { this.currentFontSize--; }
  adjustPaddingSize(): void { this.paddingSize = this.currentFontSize / 5; }
  toggleNoteVisibility() { this.isNoteVisible = !this.isNoteVisible; }
  printThisPage() { window.print(); }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}

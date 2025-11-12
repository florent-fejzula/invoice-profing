import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from 'src/environments/environment.interface';
import { environment } from 'src/environments/environment';

import { CompanyService } from '../../../services/company.service';
import { InvoicesService } from 'src/app/services/invoices.service';

import { InvoiceItemModalComponent } from '../modals/invoice-item-modal/invoice-item-modal.component';
import { InvoiceMetaModalComponent } from '../modals/invoice-meta-modal/invoice-meta-modal.component';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  isSaving = false;

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

  isAllocatingNumber = false;

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
    private companyService: CompanyService,
    private invoicesSvc: InvoicesService,
    private snack: MatSnackBar
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
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
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
  async openInvoiceMetaModal(): Promise<void> {
    const dialogRef = this.dialog.open(InvoiceMetaModalComponent, {
      width: '420px',
      data: { ...this.header }, // seed modal with current values
      disableClose: true,
    });

    const res = await dialogRef.afterClosed().toPromise();
    if (!res) return; // user cancelled

    // If the modal asked to assign a number and we don't have one yet
    if (res.requestNumber && !this.header.fakturaBroj) {
      await this.allocateNumberNow(); // uses the allocator we added earlier
    }

    // Apply only meta fields returned by the modal (client fields are handled in header/client modal)
    this.header = {
      ...this.header,
      datum: res.datum ?? this.header.datum,
      valuta: res.valuta ?? this.header.valuta,
      fakturaTip: res.fakturaTip ?? this.header.fakturaTip,
      fakturaBroj: res.fakturaBroj ?? this.header.fakturaBroj,
      companyCity: res.companyCity ?? this.header.companyCity,
    };
  }

  openInvoiceItemModal(item?: InvoiceItem): void {
    const dialogRef = this.dialog.open(InvoiceItemModalComponent, {
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

  async allocateNumberNow() {
    if (this.isAllocatingNumber) return;

    // ----- If you use a header object -----
    if ((this as any).header?.fakturaBroj) return;

    // ----- If you use top-level fields instead, use this guard -----
    // if (this.fakturaBroj) return;

    try {
      this.isAllocatingNumber = true;

      const a = await this.invoicesSvc.allocateNumberTx(this.companyId);
      // a = { broj: '2025/000001', seq, year, month }

      // ----- If you use a header object -----
      this.header = { ...this.header, fakturaBroj: a.broj };

      // ----- If you use top-level fields instead, do: -----
      // this.fakturaBroj = a.broj;

      console.log('🆗 Reserved invoice number:', a.broj);
    } catch (err) {
      console.error('❌ Allocate number failed', err);
    } finally {
      this.isAllocatingNumber = false;
    }
  }

  /** ---------- SAVE TO CLOUD ---------- */
  async saveToFirestore(): Promise<void> {
    if (!this.user) {
      this.snack.open('Најавете се за да зачувате во облак.', 'OK', {
        duration: 3000,
      });
      return;
    }
    if (this.isSaving) return;
    this.isSaving = true;

    let broj = this.header.fakturaBroj || '';
    let seq = 0;
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;

    // Try to reserve a number (if it fails but we already had one, continue)
    try {
      const alloc = await this.invoicesSvc.allocateNumberTx(this.companyId);
      broj = alloc.broj;
      seq = alloc.seq;
      year = alloc.year;
      month = alloc.month;
      this.header.fakturaBroj = broj;
    } catch (err) {
      console.error('❌ Number allocation failed:', err);
      if (!broj) {
        this.snack.open('Не успеав да резервирам број на фактура.', 'OK', {
          duration: 3500,
          panelClass: 'snack-error',
        });
        this.isSaving = false;
        return;
      }
    }

    const t = computeTotals(this.items);

    try {
      await this.invoicesSvc.create(this.companyId, {
        companyId: this.companyId,
        broj,
        seq,
        year,
        month,
        status: 'draft',
        datumIzdavanje:
          this.header.datum?.getTime?.() ??
          new Date(this.header.datum).getTime(),
        datumValuta: this.header.valuta
          ? this.header.valuta.getTime?.() ??
            new Date(this.header.valuta).getTime()
          : undefined,
        klientIme: this.header.companyTitle || '',
        klientEDB: this.header.companyID || '',
        klientAdresa: `${this.header.companyAddress ?? ''} ${
          this.header.companyCity ?? ''
        }`.trim(),
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

      this.snack.open(`Фактурата е зачувана. Бр.: ${broj}`, 'OK', {
        duration: 3000,
        panelClass: 'snack-success',
      });
    } catch (err) {
      console.error('❌ Failed saving invoice:', err);
      this.snack.open('Грешка при зачувување на фактурата.', 'OK', {
        duration: 4000,
        panelClass: 'snack-error',
      });
    } finally {
      this.isSaving = false;
    }
  }

  /** ---------- UI misc ---------- */
  increaseFontSize(): void {
    this.currentFontSize++;
  }
  decreaseFontSize(): void {
    this.currentFontSize--;
  }
  adjustPaddingSize(): void {
    this.paddingSize = this.currentFontSize / 5;
  }
  toggleNoteVisibility() {
    this.isNoteVisible = !this.isNoteVisible;
  }
  printThisPage() {
    window.print();
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}

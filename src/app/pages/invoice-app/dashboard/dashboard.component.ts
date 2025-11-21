import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from 'src/environments/environment.interface';
import { environment } from 'src/environments/environment';

import { CompanyService } from '../../../services/company.service';
import { InvoicesService } from 'src/app/services/invoices.service';

import { InvoiceItemModalComponent } from '../modals/invoice-item-modal/invoice-item-modal.component';
import { InvoiceMetaModalComponent } from '../modals/invoice-meta-modal/invoice-meta-modal.component';

import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router, ActivatedRoute } from '@angular/router';
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

  // tracks whether we're editing an existing invoice (from DB)
  currentInvoiceId: string | null = null;

  // consolidated header
  header: InvoiceHeaderState = {
    datum: new Date(),
    valuta: new Date(),
    fakturaTip: 'Фактура',
    fakturaBroj: '',
    companyTitle: '',
    companyAddress: '',
    companyCity: '',
    companyID: '',
    companyEmail: '',
    companyPhone: '',
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
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private companyService: CompanyService,
    private invoicesSvc: InvoicesService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => (this.user = user));

    this.companyService.getCompany().subscribe((data) => {
      this.company = data;
      if (data && (data as any).id) {
        this.companyId = (data as any).id;
      }
    });

    // React to query param ?invoiceId=...
    this.route.queryParamMap.subscribe((params) => {
      const invoiceId = params.get('invoiceId');

      if (invoiceId) {
        this.currentInvoiceId = invoiceId;
        this.loadInvoiceFromDb(invoiceId);
      } else {
        // new blank invoice
        this.currentInvoiceId = null;
        this.header = {
          datum: new Date(),
          valuta: new Date(),
          fakturaTip: 'Фактура',
          fakturaBroj: '',
          companyTitle: '',
          companyAddress: '',
          companyCity: '',
          companyID: '',
          companyEmail: '',
          companyPhone: '',
        };
        this.slobodenOpis = '';
        this.napomena = '';
        this.soZborovi = '';
        this.items = [];
        this.recompute();
      }
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

        this.currentInvoiceId = null; // JSON import = new local invoice

        this.header = {
          datum: new Date(imported.datum),
          valuta: new Date(imported.valuta),
          fakturaTip: imported.fakturaTip,
          fakturaBroj: imported.fakturaBroj,
          companyTitle: imported.companyTitle,
          companyAddress: imported.companyAddress,
          companyCity: imported.companyCity,
          companyID: imported.companyID,
          companyEmail: imported.companyEmail ?? '',
          companyPhone: imported.companyPhone ?? '',
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

    if ((this as any).header?.fakturaBroj) return;

    try {
      this.isAllocatingNumber = true;

      const a = await this.invoicesSvc.allocateNumberTx(this.companyId);
      this.header = { ...this.header, fakturaBroj: a.broj };

      console.log('🆗 Reserved invoice number:', a.broj);
    } catch (err) {
      console.error('❌ Allocate number failed:', err);
    } finally {
      this.isAllocatingNumber = false;
    }
  }

  async loadInvoiceFromDb(id: string) {
    try {
      const doc = await this.invoicesSvc.get(this.companyId, id);
      if (!doc) {
        console.warn('Invoice not found:', id);
        this.snack.open('Фактурата не беше пронајдена.', 'OK', {
          duration: 3000,
          panelClass: 'snack-error',
        });
        return;
      }

      this.currentInvoiceId = id;

      // Map Firestore doc → header
      this.header = {
        ...this.header,
        fakturaBroj: doc.broj,
        datum: new Date(doc.datumIzdavanje),
        valuta: doc.datumValuta
          ? new Date(doc.datumValuta)
          : new Date(doc.datumIzdavanje),
        fakturaTip: this.header.fakturaTip || 'Фактура',
        companyTitle: doc.klientIme || '',
        companyID: doc.klientEDB || '',
        companyAddress: doc.klientAdresa || '',
        companyCity: doc.klientGrad || '',
        companyEmail: doc.klientEmail || '',
        companyPhone: doc.klientTelefon || '',
      };

      // Map other fields
      this.napomena = doc.zabeleshka || '';
      this.slobodenOpis = (doc as any).slobodenOpis || '';
      this.soZborovi = (doc as any).soZborovi || '';
      this.isNoteVisible =
        typeof (doc as any).noteVisible === 'boolean'
          ? (doc as any).noteVisible
          : true;

      this.items = doc.stavki || [];

      this.recompute();
    } catch (err) {
      console.error('Failed to load invoice', err);
      this.snack.open('Грешка при вчитување на фактурата.', 'OK', {
        duration: 4000,
        panelClass: 'snack-error',
      });
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

    const broj = (this.header.fakturaBroj || '').trim();
    const t = computeTotals(this.items);

    // ✅ CASE 1: UPDATE EXISTING INVOICE
    if (this.currentInvoiceId) {
      try {
        await this.invoicesSvc.update(this.companyId, this.currentInvoiceId, {
          broj,
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
          klientAdresa: this.header.companyAddress || '',
          klientGrad: this.header.companyCity || '',
          klientEmail: this.header.companyEmail || '',
          klientTelefon: this.header.companyPhone || '',
          valuta: 'MKD',
          stavki: this.items,
          iznosBezDDV: t.iznosBezDDV,
          ddvVkupno: t.vkupnoDDV,
          vkupno: t.vkupno,
          zabeleshka: this.napomena || '',
          slobodenOpis: this.slobodenOpis || '',
          soZborovi: this.soZborovi || '',
          noteVisible: this.isNoteVisible,
        });

        this.snack.open(`Фактурата е ажурирана. Бр.: ${broj}`, 'OK', {
          duration: 3000,
          panelClass: 'snack-success',
        });
      } catch (err) {
        console.error('❌ Failed updating invoice:', err);
        this.snack.open('Грешка при ажурирање на фактурата.', 'OK', {
          duration: 4000,
          panelClass: 'snack-error',
        });
      } finally {
        this.isSaving = false;
      }
      return;
    }

    // ✅ CASE 2: CREATE NEW INVOICE
    let finalBroj = broj;
    let seq = 0;
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;

    try {
      if (!finalBroj) {
        const alloc = await this.invoicesSvc.allocateNumberTx(this.companyId);
        finalBroj = alloc.broj;
        seq = alloc.seq;
        year = alloc.year;
        month = alloc.month;
        this.header.fakturaBroj = finalBroj;
      } else {
        const match = /^(\d{4})\/(\d+)$/.exec(finalBroj);
        if (match) {
          year = Number(match[1]);
          seq = Number(match[2]);
        }
        const d = this.header.datum ?? new Date();
        const asDate = d instanceof Date ? d : new Date(d);
        month = asDate.getMonth() + 1;
      }
    } catch (err) {
      console.error('❌ Number allocation failed:', err);
      if (!finalBroj) {
        this.snack.open('Не успеав да резервирам број на фактура.', 'OK', {
          duration: 3500,
          panelClass: 'snack-error',
        });
        this.isSaving = false;
        return;
      }
    }

    try {
      const newId = await this.invoicesSvc.create(this.companyId, {
        companyId: this.companyId,
        broj: finalBroj,
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
        klientAdresa: this.header.companyAddress || '',
        klientGrad: this.header.companyCity || '',
        klientEmail: this.header.companyEmail || '',
        klientTelefon: this.header.companyPhone || '',
        valuta: 'MKD',
        stavki: this.items,
        iznosBezDDV: t.iznosBezDDV,
        ddvVkupno: t.vkupnoDDV,
        vkupno: t.vkupno,
        zabeleshka: this.napomena || '',
        slobodenOpis: this.slobodenOpis || '',
        soZborovi: this.soZborovi || '',
        noteVisible: this.isNoteVisible,
        createdByUid: this.user.uid,
      });

      // After first save, treat it as existing invoice
      this.currentInvoiceId = newId;

      this.snack.open(`Фактурата е зачувана. Бр.: ${finalBroj}`, 'OK', {
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

import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from 'src/environments/environment.interface';
import { environment } from 'src/environments/environment';

import { CompanyService } from '../../../services/company.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import {
  InvoiceFileService,
  InvoiceJsonPayload,
} from 'src/app/services/invoice-file.service';
import { InvoicePersistenceService } from 'src/app/services/invoice-persistence.service';

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
import { combineLatest, filter, map, shareReplay, take } from 'rxjs';
import { InvoiceTableComponent } from './invoice-table/invoice-table.component';
import { mkMoneyToWords } from 'src/app/utils/mk-money-to-words';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  @ViewChild(InvoiceTableComponent) invoiceTable?: InvoiceTableComponent;

  environment: Environment = environment;

  company: any;
  user: any = null;

  isSaving = false;

  // TEMP: replace with real ID from CompanyService
  companyId = '';

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
    private snack: MatSnackBar,
    private invoiceFile: InvoiceFileService,
    private invoicePersistence: InvoicePersistenceService,
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => (this.user = user));

    const company$ = this.companyService.getCompany().pipe(
      filter((c: any) => !!c?.id),
      shareReplay(1), // important so it doesn't refetch everywhere
    );

    const invoiceId$ = this.route.queryParamMap.pipe(
      map((p) => p.get('invoiceId')),
    );

    combineLatest([company$, invoiceId$]).subscribe(([company, invoiceId]) => {
      this.company = company; // ✅ this fills issuer fields in UI/print
      this.companyId = company.id; // ✅ correct tenant

      if (invoiceId) {
        this.currentInvoiceId = invoiceId;
        this.loadInvoiceFromDb(invoiceId);
      } else {
        this.resetToNewInvoice();
      }
    });

    this.recompute();
  }

  private resetToNewInvoice() {
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
    this.napomena = '';
    this.soZborovi = '';
    this.items = [];
    this.recompute();
  }

  // child event handler
  onHeaderChange(patch: Partial<InvoiceHeaderState>) {
    this.header = { ...this.header, ...patch };
  }

  /** ---------- FILE IMPORT / EXPORT ---------- */
  async exportToJson(): Promise<void> {
    const payload = this.invoiceFile.buildPayload(
      this.header,
      this.napomena,
      this.soZborovi,
      this.vkupenIznosBezDDV,
      this.vkupnoDDV,
      this.items,
    );

    this.invoiceFile.downloadJson(payload, 'invoice_data.json');
  }

  async importJson(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imported: InvoiceJsonPayload =
        await this.invoiceFile.parseJsonFile(file);

      this.currentInvoiceId = null; // JSON import = local invoice, not bound to DB

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

      this.napomena = imported.napomena;
      this.soZborovi = imported.soZborovi;
      this.items = (imported.items || []).map((it) => {
        const ddv = Number(it.ddv ?? 0);
        const factor = 1 + ddv / 100;
        const cenaBez = Number(it.cenaBezDanok ?? 0);
        const cenaSo = Number((it as any).cenaSoDdv ?? 0);

        return { ...it, cenaSoDdv: cenaSo > 0 ? cenaSo : cenaBez * factor };
      });

      this.recompute();
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      this.snack.open('Грешка при вчитување JSON.', 'OK', {
        duration: 3000,
        panelClass: 'snack-error',
      });
    }
  }

  onItemsChange(items: InvoiceItem[]) {
    this.items = items;
    this.recompute();
  }

  addRow(focusOpis = false) {
    const ddv = 18;
    const cenaBezDanok = 0;

    const newItem: InvoiceItem = {
      opis: '',
      em: 'ком',
      kolicina: 1,
      cenaBezDanok,
      cenaSoDdv: cenaBezDanok * (1 + ddv / 100), // ✅
      rabatProcent: 0,
      ddv,
    };

    this.items = [...this.items, newItem];
    this.recompute();

    if (focusOpis) {
      setTimeout(() => {
        this.invoiceTable?.focusCell(this.items.length - 1, 'opis');
      }, 0);
    }
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

    const total = this.vkupenIznosBezDDV + this.vkupnoDDV;
    this.soZborovi = mkMoneyToWords(total);
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
      console.error('❌ Allocate number failed', err);
    } finally {
      this.isAllocatingNumber = false;
    }
  }

  /** ---------- FIRESTORE: LOAD ---------- */
  async loadInvoiceFromDb(id: string) {
    try {
      const data = await this.invoicePersistence.loadForEdit(
        this.companyId,
        id,
      );

      this.currentInvoiceId = data.id;
      this.header = data.header;
      this.items = (data.items ?? []).map((it) => {
        const ddv = Number(it.ddv ?? 0);
        const factor = 1 + ddv / 100;

        // if cenaSoDdv missing or 0, compute it from net
        const cenaBez = Number(it.cenaBezDanok ?? 0);
        const cenaSo = Number((it as any).cenaSoDdv ?? 0);

        return {
          ...it,
          cenaSoDdv: cenaSo > 0 ? cenaSo : cenaBez * factor,
        };
      });
      this.soZborovi = data.soZborovi;
      this.napomena = data.napomena;
      this.isNoteVisible = data.isNoteVisible;

      this.recompute();
    } catch (err) {
      console.error('Failed to load invoice', err);
      this.snack.open('Грешка при вчитување на фактурата.', 'OK', {
        duration: 4000,
        panelClass: 'snack-error',
      });
    }
  }

  /** ---------- FIRESTORE: SAVE (create / update) ---------- */
  async saveToFirestore(): Promise<void> {
    if (!this.user) {
      this.snack.open('Најавете се за да зачувате во облак.', 'OK', {
        duration: 3000,
      });
      return;
    }
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const result = await this.invoicePersistence.save({
        companyId: this.companyId,
        currentInvoiceId: this.currentInvoiceId,
        userUid: this.user.uid,
        header: this.header,
        items: this.items,
        soZborovi: this.soZborovi,
        napomena: this.napomena,
        isNoteVisible: this.isNoteVisible,
      });

      // sync local state with result
      this.header.fakturaBroj = result.broj;
      this.currentInvoiceId = result.id;

      const msg = result.isNew
        ? `Фактурата е зачувана. Бр.: ${result.broj}`
        : `Фактурата е ажурирана. Бр.: ${result.broj}`;

      this.snack.open(msg, 'OK', {
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

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Environment } from 'src/environments/environment.interface';
import { environment } from 'src/environments/environment';

import { DataService } from '../../../services/data.service';
import { CompanyService } from '../../../services/company.service';
import { InvoicesService } from 'src/app/services/invoices.service';
import { ClientsService } from 'src/app/services/clients.service';

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

// client picker
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ClientDoc } from 'src/app/models/client.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  environment: Environment = environment;

  company: any;
  user: any = null; // logged-in user

  // TEMP: hardcode your company doc id for now (replace with CompanyService id later)
  companyId: string = 'GLp2xLv3ZzX6ktQZUsyU';

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

  // totals
  vkupenIznosBezDDV = 0;
  vkupnoDDV = 0; // total DDV (VAT)

  isNoteVisible = true;

  summaryData: SummaryRow[] = [];

  soZborovi = '';
  exportFileName = 'exported-data.json';

  items: InvoiceItem[] = [];

  // -------- Client picker (typeahead) ----------
  clientCtrl = new FormControl('');
  clientOptions$: Observable<ClientDoc[]> = of([]);
  selectedClient?: ClientDoc;

  constructor(
    private auth: Auth,
    private router: Router,
    private dialog: MatDialog,
    private dataService: DataService,
    private companyService: CompanyService,
    private invoicesSvc: InvoicesService,
    private clientsSvc: ClientsService
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;
    });

    // If your companyService returns the active company doc, you can pull its id here later.
    this.companyService.getCompany().subscribe((data) => {
      this.company = data;
      // Example (uncomment when your service returns an id):
      // if (data?.id) this.companyId = data.id;
    });

    this.recompute();

    // wire typeahead
    this.clientOptions$ = this.clientCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((val) => {
        // val can be a string (typing) OR a ClientDoc (after selection)
        const term = typeof val === 'string' ? val.trim() : val?.name ?? '';
        return term
          ? this.clientsSvc.searchByName(this.companyId, term, 10)
          : of([]);
      })
    );
  }

  /** ---------- FILE IMPORT / EXPORT (local JSON) ---------- */

  async exportToJson(): Promise<void> {
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
      textareaValue:
        (document.querySelector('textarea') as HTMLTextAreaElement)?.value ||
        '',
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

        const textarea = document.querySelector(
          'textarea'
        ) as HTMLTextAreaElement;
        if (textarea) textarea.value = importedData.textareaValue || '';

        this.napomena = importedData.napomena;
        this.soZborovi = importedData.soZborovi;
        this.items = importedData.items || [];

        this.recompute();
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    };

    reader.readAsText(file);
  }

  /** ---------- MODALS / ITEM CRUD ---------- */

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

  /** ---------- CALC & SUMMARY (using util) ---------- */

  private recompute() {
    this.summaryData = computeSummaryByDDV(this.items);
    const t = computeTotals(this.items);
    this.vkupenIznosBezDDV = t.iznosBezDDV;
    this.vkupnoDDV = t.vkupnoDDV;
  }

  cenaSoPresmetanRabat(item: InvoiceItem): number {
    const popustVrednost = (item.cenaBezDanok * (item.rabatProcent ?? 0)) / 100;
    return popustVrednost;
  }

  cenaSoDDV(item: InvoiceItem) {
    const cenaSoPresmetanRabat =
      item.kolicina * item.cenaBezDanok * (1 - (item.rabatProcent ?? 0) / 100);
    const iznosDDV = cenaSoPresmetanRabat * ((item.ddv ?? 0) / 100);
    return cenaSoPresmetanRabat + iznosDDV;
  }

  /** ---------- CLIENT PICKER ---------- */

  onSelectClient(c: ClientDoc) {
    this.selectedClient = c;

    // map to your current invoice fields
    this.companyTitle = c.name ?? '';
    this.companyID = c.taxId ?? '';
    this.companyAddress = c.address ?? '';
    this.companyCity = ''; // optional split later

    // show the chosen name in the input without re-triggering search
    this.clientCtrl.setValue(c.name ?? '', { emitEvent: false });
  }

  async addQuickClient() {
    const name = prompt('Име на клиент');
    if (!name) return;
    const taxId = prompt('ЕДБ (опционално)') || undefined;
    const address = prompt('Адреса (опционално)') || undefined;

    const id = await this.clientsSvc.create(this.companyId, {
      name,
      taxId,
      address,
    });
    const c = await this.clientsSvc.get(this.companyId, id);
    if (c) this.onSelectClient(c);
  }

  displayClient = (v: ClientDoc | string | null | undefined) =>
    typeof v === 'object' && v ? v.name : v ?? '';

  /** ---------- SAVE TO CLOUD (Firestore) ---------- */

  async saveToFirestore() {
    if (!this.user) return;
    const t = computeTotals(this.items);

    await this.invoicesSvc.create(this.companyId, {
      companyId: this.companyId,
      broj: this.fakturaBroj || '',
      status: 'draft',
      datumIzdavanje: this.datum?.getTime?.() ?? new Date(this.datum).getTime(),
      datumValuta: this.valuta
        ? (this.valuta as Date).getTime?.() ?? new Date(this.valuta).getTime()
        : undefined,

      // snapshot of chosen/typed client
      klientIme: this.companyTitle || '',
      klientEDB: this.companyID || '',
      klientAdresa: `${this.companyAddress ?? ''} ${
        this.companyCity ?? ''
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

    console.log('✅ Invoice saved to Firestore');
  }

  /** ---------- UI MISC ---------- */

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

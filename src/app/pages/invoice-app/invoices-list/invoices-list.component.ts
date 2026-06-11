import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InvoicesService } from 'src/app/services/invoices.service';
import { InvoiceDoc } from 'src/app/models/invoice.model';
import { CompanyService } from 'src/app/services/company.service';
import { take } from 'rxjs';

type SortKey = 'broj' | 'datumIzdavanje' | 'klientIme' | 'iznosBezDDV' | 'ddvVkupno' | 'vkupno';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss'],
})
export class InvoicesListComponent implements OnInit {
  companyId!: string;

  invoices: InvoiceDoc[] = [];
  isLoading = false;
  error: string | null = null;

  sortKey: SortKey = 'datumIzdavanje';
  sortDir: 'asc' | 'desc' = 'desc';

  get sortedInvoices(): InvoiceDoc[] {
    return [...this.invoices].sort((a, b) => {
      const va = a[this.sortKey];
      const vb = b[this.sortKey];
      let cmp = 0;
      if (typeof va === 'string' && typeof vb === 'string') {
        cmp = va.localeCompare(vb, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        cmp = (va as number) - (vb as number);
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  sort(key: SortKey) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }

  constructor(
    private invoicesSvc: InvoicesService,
    private companyService: CompanyService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.companyService
      .getCompany()
      .pipe(take(1))
      .subscribe({
        next: (company: any) => {
          if (!company?.id) {
            this.error = 'Нема компанија за овој корисник.';
            this.isLoading = false;
            return;
          }

          this.companyId = company.id;
          this.loadInvoices(); // now loads correct tenant invoices
        },
        error: (err) => {
          console.error('Failed to resolve company', err);
          this.error = 'Не успеав да ја вчитам компанијата.';
          this.isLoading = false;
        },
      });
  }

  async loadInvoices() {
    if (!this.companyId) return;

    this.isLoading = true;
    this.error = null;

    try {
      this.invoices = await this.invoicesSvc.list(this.companyId, 100);
    } catch (err) {
      console.error('Failed to load invoices', err);
      this.error = 'Не успеав да ги вчитам фактурите.';
    } finally {
      this.isLoading = false;
    }
  }

  openInvoice(inv: InvoiceDoc) {
    if (!inv.id) return;

    this.router.navigate(['/invoice'], {
      queryParams: { invoiceId: inv.id, companyId: this.companyId },
    });
  }

  async deleteInvoice(inv: InvoiceDoc) {
    if (!inv.id) return;

    const ok = confirm(
      `Дали сте сигурни дека сакате да ја избришете фактурата ${inv.broj}?`
    );
    if (!ok) return;

    try {
      await this.invoicesSvc.delete(this.companyId, inv.id);

      // remove locally
      this.invoices = this.invoices.filter((i) => i.id !== inv.id);

      this.snack.open('Фактурата е избришана.', 'OK', {
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed deleting invoice', err);
      this.snack.open('Не успеав да ја избришам фактурата.', 'OK', {
        duration: 3500,
      });
    }
  }
}

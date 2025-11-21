import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InvoicesService } from 'src/app/services/invoices.service';
import { InvoiceDoc } from 'src/app/models/invoice.model';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss'],
})
export class InvoicesListComponent implements OnInit {
  companyId = 'GLp2xLv3ZzX6ktQZUsyU'; // same as dashboard for now

  invoices: InvoiceDoc[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private invoicesSvc: InvoicesService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  async loadInvoices() {
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
      queryParams: { invoiceId: inv.id },
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

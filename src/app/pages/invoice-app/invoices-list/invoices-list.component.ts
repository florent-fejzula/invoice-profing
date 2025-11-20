import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InvoicesService } from 'src/app/services/invoices.service';
import { InvoiceDoc } from 'src/app/models/invoice.model';

@Component({
  selector: 'app-invoices-list',
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.scss'],
})
export class InvoicesListComponent implements OnInit {
  // same hard-coded companyId you use in Dashboard for now
  companyId = 'GLp2xLv3ZzX6ktQZUsyU';

  invoices: InvoiceDoc[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private invoicesSvc: InvoicesService, private router: Router) {}

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
    // Go to dashboard and pass invoiceId as query param
    this.router.navigate(['/invoice'], { queryParams: { invoiceId: inv.id } });
  }
}

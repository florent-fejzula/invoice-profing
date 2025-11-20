import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceRoutingModule } from './invoice-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';

// ✅ Import Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

// ✅ Import Edit & Entry Modals
import { InvoiceMetaModalComponent } from './modals/invoice-meta-modal/invoice-meta-modal.component';
import { InvoiceItemModalComponent } from './modals/invoice-item-modal/invoice-item-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InvoiceTableComponent } from './dashboard/invoice-table/invoice-table.component';
import { InvoiceTotalsComponent } from './dashboard/invoice-totals/invoice-totals.component';
import { InvoiceHeaderComponent } from './dashboard/invoice-header/invoice-header.component';
import { ClientModalComponent } from './modals/client-modal/client-modal.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { InvoicesListComponent } from './invoices-list/invoices-list.component';

@NgModule({
  declarations: [
    DashboardComponent,
    InvoicesListComponent,
    InvoiceMetaModalComponent, // ✅ Moved here
    InvoiceItemModalComponent, // ✅ Moved here
    InvoiceTableComponent,
    InvoiceTotalsComponent,
    InvoiceHeaderComponent,
    ClientModalComponent,
  ],
  imports: [
    CommonModule,
    InvoiceRoutingModule,
    FormsModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatSnackBarModule
  ]
})
export class InvoiceModule { }

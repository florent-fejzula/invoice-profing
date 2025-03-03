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

// ✅ Import Edit & Entry Modals
import { EditModalComponent } from './modals/edit-modal/edit-modal.component';
import { EntryModalComponent } from './modals/entry-modal/entry-modal.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DashboardComponent,
    EditModalComponent, // ✅ Moved here
    EntryModalComponent // ✅ Moved here
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
    MatSelectModule
  ]
})
export class InvoiceModule { }

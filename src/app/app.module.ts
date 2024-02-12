import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EditModalComponent } from './edit-modal/edit-modal.component';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EntryModalComponent } from './entry-modal/entry-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FileSaveDialogComponent } from './file-save-dialog/file-save-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    EditModalComponent,
    EntryModalComponent,
    FileSaveDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NoopAnimationsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSelectModule
  ],
  providers: [
    {
      provide: MatDialogRef,
      useValue: {}
    },
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

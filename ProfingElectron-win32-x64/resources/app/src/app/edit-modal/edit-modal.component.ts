import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DataService } from '../data.service';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditModalComponent {
  datum: Date = new Date();
  valuta: Date = new Date();
  // selectedOption: string = 'Фактура';
  // options: string[] = ['Фактура', 'Авансна Фактура', 'Понуда'];
  fakturaTip = '';
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';
  slobodenOpis = '';

  constructor(
    public dialogRef: MatDialogRef<EditModalComponent>,
    private dataService: DataService
  ) {}

  onDateChange(event: any, propertyToUpdate: string): void {
    const selectedDate = event.value;

    if (selectedDate) {
      (this as any)[propertyToUpdate] = selectedDate;
      (this.dataService as any)[propertyToUpdate] = selectedDate;
    }
  }

  onSaveClick(): void {
    this.dataService.fakturaTip = this.fakturaTip;
    this.dataService.fakturaBroj = this.fakturaBroj;
    this.dataService.companyTitle = this.companyTitle;
    this.dataService.companyAddress = this.companyAddress;
    this.dataService.companyCity = this.companyCity;
    this.dataService.companyID = this.companyID;
    this.dataService.slobodenOpis = this.slobodenOpis;
    // this.dataService.selectedOption = this.selectedOption;
    this.dialogRef.close();
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ClientModalData {
  name?: string;
  taxId?: string;
  address?: string;
  city?: string;
  email?: string;
  phone?: string;
}

@Component({
  selector: 'app-client-modal',
  templateUrl: './client-modal.component.html',
  styleUrls: ['./client-modal.component.scss']
})
export class ClientModalComponent {
  name = '';
  taxId = '';
  address = '';
  city = '';
  email = '';
  phone = '';

  constructor(
    public dialogRef: MatDialogRef<ClientModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClientModalData
  ) {
    if (data) {
      this.name = data.name ?? '';
      this.taxId = data.taxId ?? '';
      this.address = data.address ?? '';
      this.city = data.city ?? '';
      this.email = data.email ?? '';
      this.phone = data.phone ?? '';
    }
  }

  onSaveClick(): void {
    this.dialogRef.close({
      name: this.name,
      taxId: this.taxId,
      address: this.address,
      city: this.city,
      email: this.email,
      phone: this.phone
    });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

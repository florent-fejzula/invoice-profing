import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-file-save-dialog',
  templateUrl: './file-save-dialog.component.html',
  styleUrls: ['./file-save-dialog.component.scss']
})
export class FileSaveDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<FileSaveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fileName: string }
  ) { }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}

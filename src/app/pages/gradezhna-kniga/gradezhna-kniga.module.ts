import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradezhnaKnigaRoutingModule } from './gradezhna-kniga-routing.module';
import { MainComponent } from './main/main.component';

// ✅ Import necessary Angular Material modules
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GradezhnaListComponent } from './gradezhna-list/gradezhna-list.component';

@NgModule({
  declarations: [MainComponent, GradezhnaListComponent],
  imports: [
    CommonModule,
    GradezhnaKnigaRoutingModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
})
export class GradezhnaKnigaModule {}

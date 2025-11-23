import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { GradezhnaListComponent } from './gradezhna-list/gradezhna-list.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'list', component: GradezhnaListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GradezhnaKnigaRoutingModule {}

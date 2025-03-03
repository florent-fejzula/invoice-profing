import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminGuard } from './guards/admin.guard';
import { AutoRedirectComponent } from './auto-redirect/auto-redirect.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auto-redirect' },
  { path: 'auto-redirect', component: AutoRedirectComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminPanelComponent, canActivate: [AdminGuard] },

  // ✅ Lazy load Invoice App (was previously 'dashboard')
  {
    path: 'invoice',
    loadChildren: () =>
      import('./pages/invoice-app/invoice.module').then((m) => m.InvoiceModule),
    canActivate: [AuthGuard],
  },

  // ✅ Lazy load Gradezhna Kniga App
  {
    path: 'gradezhna-kniga',
    loadChildren: () =>
      import('./pages/gradezhna-kniga/gradezhna-kniga.module').then(
        (m) => m.GradezhnaKnigaModule
      ),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

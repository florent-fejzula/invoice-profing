import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { AdminGuard } from './guards/admin.guard';
import { AutoRedirectComponent } from './auto-redirect/auto-redirect.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auto-redirect' }, // 👈 Handle auto-redirect logic
  { path: 'auto-redirect', component: AutoRedirectComponent }, // 👈 New component to handle redirect logic
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminPanelComponent, canActivate: [AdminGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

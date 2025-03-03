import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  constructor(private router: Router, private auth: Auth) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}

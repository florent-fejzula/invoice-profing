import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from 'rxfire/auth';
import { map } from 'rxjs';

const ADMIN_UID = 'nArNHAOwWNR7dgMO39ILvWRPfni1';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
isAdmin$ = authState(this.auth).pipe(
    map((user) => !!user && user.uid === ADMIN_UID)
  );

  constructor(private auth: Auth, private router: Router) {}

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}

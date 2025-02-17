import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Component({
  selector: 'app-auto-redirect',
  template: '', // No UI needed
})
export class AutoRedirectComponent implements OnInit {
  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.router.navigate(['/dashboard']); // ✅ Send logged-in users to dashboard
      } else {
        this.router.navigate(['/login']); // 🚪 Send guests to login
      }
    });
  }
}

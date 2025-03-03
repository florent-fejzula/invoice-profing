import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from 'rxfire/auth';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-auto-redirect',
  template: '',
})
export class AutoRedirectComponent implements OnInit {
  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    authState(this.auth)
      .pipe(take(1))
      .subscribe((user) => {
        if (user) {
          this.router.navigate(['/invoice']); // ✅ Redirect to Invoice App
        } else {
          this.router.navigate(['/login']);
        }
      });
  }
}

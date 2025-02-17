import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Router } from '@angular/router';

// Import from firebase/auth
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  user: any = null;

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    // ✅ Ensure Firebase Auth persists the session correctly
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        // Monitor authentication state
        onAuthStateChanged(this.auth, (user) => {
          this.user = user;
          if (user) {
            console.log('User is logged in:', user);
          } else {
            console.log('No user found');
          }
        });
      })
      .catch((error) => {
        console.error('Auth persistence error:', error);
      });
  }
}

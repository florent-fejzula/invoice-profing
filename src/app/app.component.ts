import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { Router, NavigationEnd } from '@angular/router';

// Import from firebase/auth
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
// import { addDoc, collection } from 'firebase/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  user: any = null;
  showSidebar: boolean = false;

  constructor(private auth: Auth, private router: Router, private firestore: Firestore) {}

  ngOnInit() {
    // this.addCompany();

    // ✅ Ensure Firebase Auth persists the session correctly
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        // Monitor authentication state
        onAuthStateChanged(this.auth, (user) => {
          this.user = user;
          this.updateSidebarVisibility();
        });
      })
      .catch((error) => {
        console.error('Auth persistence error:', error);
      });

    // ✅ Detect route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateSidebarVisibility();
      }
    });
  }

  updateSidebarVisibility() {
    // ✅ Hide sidebar on login page, show it everywhere else if logged in
    this.showSidebar = this.user !== null && this.router.url !== '/login';
  }
}

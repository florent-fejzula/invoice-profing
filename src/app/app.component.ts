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
  sidebarMobileOpen = false;

  constructor(private auth: Auth, private router: Router, private firestore: Firestore) {}

  ngOnInit() {
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => {
        onAuthStateChanged(this.auth, (user) => {
          this.user = user;
          this.updateSidebarVisibility();
        });
      })
      .catch((error) => {
        console.error('Auth persistence error:', error);
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateSidebarVisibility();
        this.sidebarMobileOpen = false;
      }
    });
  }

  updateSidebarVisibility() {
    this.showSidebar = this.user !== null && this.router.url !== '/login';
  }

  toggleSidebar() {
    this.sidebarMobileOpen = !this.sidebarMobileOpen;
  }

  closeSidebar() {
    this.sidebarMobileOpen = false;
  }
}

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
  
  // async addCompany() {
  //   const companiesCollection = collection(this.firestore, 'companies');

  //   const companyData = {
  //     EDB: "MK4082013512249",
  //     accountNo: "200002667032549",
  //     address: "Ул. Павле Илич бр.37/1-7, 1000 Скопје",
  //     bank: "СТОПАНСКА БАНКА А.Д. СКОПЈЕ",
  //     email: "kimielektrik@yahoo.com",
  //     name: "КИМИ ЕЛЕКТРИК ДООЕЛ",
  //     ownerName: "Башким Мифтари",
  //     phone: "072 554 650",
  //     settings: {
  //       logo: false,
  //       showTaxCategories: true
  //     },
  //     status: "active"
  //   };

  //   try {
  //     await addDoc(companiesCollection, companyData);
  //     console.log("Company added successfully!");
  //   } catch (error) {
  //     console.error("Error adding company:", error);
  //   }
  // }

  updateSidebarVisibility() {
    // ✅ Hide sidebar on login page, show it everywhere else if logged in
    this.showSidebar = this.user !== null && this.router.url !== '/login';
  }
}

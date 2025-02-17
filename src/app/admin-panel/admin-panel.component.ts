import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Company {
  EDB?: string;
  accountNo: string;
  address: string;
  bank: string;
  email: string;
  name: string;
  ownerName: string;
  phone: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  companies$: Observable<Company[]> | undefined;

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    const companiesCollection = collection(this.firestore, 'companies');
    // Use collectionData with idField to include the document ID in each company object
    this.companies$ = collectionData(companiesCollection, {
      idField: 'id',
    }) as Observable<Company[]>;
  }

  // Update the function to query based on the EDB field
  async toggleCompanyStatus(company: Company): Promise<void> {
    if (!company.EDB) return;

    try {
      // Step 1: Query the companies collection to find the document where 'EDB' matches
      const companiesCollection = collection(this.firestore, 'companies');
      const q = query(companiesCollection, where('EDB', '==', company.EDB));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Step 2: Get the first document (assuming EDB is unique)
        const companyDocRef = doc(
          this.firestore,
          'companies',
          querySnapshot.docs[0].id
        );

        // Step 3: Update the status field
        const newStatus: 'active' | 'inactive' =
          company.status === 'active' ? 'inactive' : 'active';
        await updateDoc(companyDocRef, { status: newStatus });

        console.log(`Company status updated to ${newStatus}`);
      } else {
        console.error('Company not found');
      }
    } catch (error) {
      console.error('Error updating company status: ', error);
    }
  }
}

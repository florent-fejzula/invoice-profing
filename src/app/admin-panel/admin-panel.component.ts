import { Component, OnInit } from '@angular/core';
import { httpsCallable, Functions } from '@angular/fire/functions';
import { Auth, user } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

interface Company {
  id: string;
  ownerUid?: string;
  email?: string;
  name?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  EDB?: string;
  bank?: string;
  accountNo?: string;
  status?: 'active' | 'inactive';
  createdAt?: any;
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit {
  private ADMIN_UID = 'nArNHAOwWNR7dgMO39ILvWRPfni1';

  isAdmin = false;
  isLoading = false;

  companies: Company[] = [];

  // Create-company form
  ownerEmail = '';
  tempPassword = '';
  name = '';
  ownerName = '';
  phone = '';
  address = '';
  EDB = '';
  bank = '';
  accountNo = '';

  isCreating = false;
  lastResult: any = null;

  constructor(
    private functions: Functions,
    private auth: Auth,
    private snack: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    const u = await firstValueFrom(user(this.auth));
    this.isAdmin = !!u?.uid && u.uid === this.ADMIN_UID;

    if (!this.isAdmin) {
      this.snack.open('No access.', 'OK', { duration: 2500 });
      return;
    }

    await this.loadCompanies();
  }

  async loadCompanies() {
    this.isLoading = true;
    try {
      const fn = httpsCallable(this.functions, 'listCompaniesForAdmin');
      const res: any = await fn();
      this.companies = (res.data?.companies ?? []) as Company[];
    } catch (e: any) {
      console.error(e);
      this.snack.open(e?.message || 'Failed loading companies', 'OK', {
        duration: 3500,
      });
    } finally {
      this.isLoading = false;
    }
  }

  async toggleCompanyStatus(company: Company) {
    if (!company.id) return;

    try {
      const fn = httpsCallable(this.functions, 'toggleCompanyStatusAdmin');
      const res: any = await fn({ companyId: company.id });

      const newStatus = res.data?.status as 'active' | 'inactive';
      company.status = newStatus;

      this.snack.open(`Status: ${newStatus}`, 'OK', { duration: 2500 });
    } catch (e: any) {
      console.error(e);
      this.snack.open(e?.message || 'Failed toggling status', 'OK', {
        duration: 3500,
      });
    }
  }

  async createCompany() {
    if (!this.ownerEmail || !this.tempPassword || !this.name) {
      this.snack.open('Fill ownerEmail, tempPassword, company name.', 'OK', {
        duration: 3000,
      });
      return;
    }

    this.isCreating = true;
    this.lastResult = null;

    try {
      const fn = httpsCallable(this.functions, 'createCompanyWithOwner');
      const res: any = await fn({
        ownerEmail: this.ownerEmail,
        tempPassword: this.tempPassword,
        company: {
          name: this.name,
          ownerName: this.ownerName,
          phone: this.phone,
          address: this.address,
          EDB: this.EDB,
          bank: this.bank,
          accountNo: this.accountNo,
          status: 'active',
        },
      });

      this.lastResult = res.data;
      this.snack.open('Company created ✅', 'OK', { duration: 3000 });

      // Refresh list
      await this.loadCompanies();

      // Optional: clear form
      // this.ownerEmail = this.tempPassword = this.name = this.ownerName = '';
    } catch (e: any) {
      console.error(e);
      this.snack.open(e?.message || 'Failed creating company', 'OK', {
        duration: 4500,
      });
    } finally {
      this.isCreating = false;
    }
  }

  async copy(text: string) {
    await navigator.clipboard.writeText(text);
    this.snack.open('Copied', 'OK', { duration: 1500 });
  }
}

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

// Normalize both Latin and Cyrillic to a common Latin form so that
// typing 'M' matches 'Маисон' and vice-versa.
const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh',
  'з':'z','и':'i','ј':'j','к':'k','л':'l','љ':'lj','м':'m',
  'н':'n','њ':'nj','о':'o','п':'p','р':'r','с':'s','т':'t',
  'у':'u','ф':'f','х':'h','ц':'c','ч':'ch','џ':'dz','ш':'sh',
};

function normalizeSearch(s: string): string {
  return s.toLowerCase().split('').map(ch => CYRILLIC_TO_LATIN[ch] ?? ch).join('');
}

import { ClientsService } from 'src/app/services/clients.service';
import { ClientDoc } from 'src/app/models/client.model';

import { MatDialog } from '@angular/material/dialog';
import { ClientModalComponent } from '../../modals/client-modal/client-modal.component';

export interface InvoiceHeaderState {
  datum: Date;
  valuta: Date;
  fakturaTip: string;
  fakturaBroj: string;
  companyTitle: string;
  companyAddress: string;
  companyCity: string;
  companyID: string;
  companyEmail?: string;
  companyPhone?: string;
}

@Component({
  selector: 'invoice-header',
  templateUrl: './invoice-header.component.html',
  styleUrls: ['./invoice-header.component.scss'],
})
export class InvoiceHeaderComponent implements OnInit, OnChanges {
  @Input() companyId!: string;
  @Input() company!: any | null;

  @Input() state!: InvoiceHeaderState;
  @Output() stateChange = new EventEmitter<Partial<InvoiceHeaderState>>();
  @Output() reserveNumber = new EventEmitter<void>();

  clientCtrl = new FormControl('');
  clientOptions$: Observable<ClientDoc[]> = of([]);

  selectedClient: ClientDoc | null = null;
  private allClients: ClientDoc[] = [];

  presetTips: string[] = ['Фактура', 'Профактура', 'Авансна Фактура', 'Понуда'];

  constructor(
    private clientsSvc: ClientsService,
    private dialog: MatDialog,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyId']?.currentValue) {
      this.clientsSvc.list(this.companyId, 500).then(c => this.allClients = c);
    }
  }

  ngOnInit(): void {

    this.clientOptions$ = this.clientCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((val) => {
        const term = typeof val === 'string' ? val.trim() : (val?.name ?? '');
        if (!term) return [];
        const needle = normalizeSearch(term);
        return this.allClients
          .filter(c => normalizeSearch(c.name ?? '').includes(needle))
          .slice(0, 10);
      }),
    );
  }

  set<K extends keyof InvoiceHeaderState>(
    key: K,
    value: InvoiceHeaderState[K],
  ) {
    this.stateChange.emit({ [key]: value } as Partial<InvoiceHeaderState>);
  }

  onDatePicked(key: 'datum' | 'valuta', value: Date | null): void {
    if (!value) return;
    this.set(key, value as InvoiceHeaderState[typeof key]);
  }

  onTipSelected(value: string): void {
    this.set('fakturaTip', value);
  }

  clearTip(): void {
    this.set('fakturaTip', '');
  }

  async openClientModal() {
    const ref = this.dialog.open(ClientModalComponent, {
      width: '520px',
      data: {},
      disableClose: true,
    });

    const result = await ref.afterClosed().toPromise();
    if (!result) return;

    const payload: any = {
      name: (result.name || '').trim(),
    };

    const setIf = (key: string, value: string) => {
      const v = (value || '').trim();
      if (v) payload[key] = v;
    };

    setIf('taxId', result.taxId);
    setIf('address', result.address);
    setIf('city', result.city);
    setIf('email', result.email);
    setIf('phone', result.phone);

    const id = await this.clientsSvc.create(this.companyId, payload);

    const created = await this.clientsSvc.get(this.companyId, id);
    if (created) {
      this.allClients = [...this.allClients, created];
      this.onSelectClient(created);
    }
  }

  async openEditClientModal() {
    const baseData = this.selectedClient
      ? {
          name: this.selectedClient.name ?? '',
          taxId: this.selectedClient.taxId ?? '',
          address: this.selectedClient.address ?? '',
          city: this.state.companyCity ?? '',
          email: this.selectedClient.email ?? '',
          phone: this.selectedClient.phone ?? '',
        }
      : {
          name: this.state.companyTitle ?? '',
          taxId: this.state.companyID ?? '',
          address: this.state.companyAddress ?? '',
          city: this.state.companyCity ?? '',
          email: this.state.companyEmail ?? '',
          phone: this.state.companyPhone ?? '',
        };

    const ref = this.dialog.open(ClientModalComponent, {
      width: '520px',
      data: baseData,
      disableClose: true,
    });

    const res = await ref.afterClosed().toPromise();
    if (!res) return;

    if (this.selectedClient && this.selectedClient.id) {
      await this.clientsSvc.update(this.companyId, this.selectedClient.id, {
        name: res.name,
        taxId: res.taxId || undefined,
        address: res.address || undefined,
        city: res.city || undefined,
        email: res.email || undefined,
        phone: res.phone || undefined,
        updatedAt: Date.now(),
      });

      this.onSelectClient({ ...this.selectedClient, ...res } as ClientDoc);
    } else {
      this.stateChange.emit({
        companyTitle: res.name ?? '',
        companyID: res.taxId ?? '',
        companyAddress: res.address ?? '',
        companyCity: res.city ?? '',
        companyEmail: res.email ?? '',
        companyPhone: res.phone ?? '',
      });
    }
  }

  onSelectClient(c: ClientDoc) {
    this.selectedClient = c;

    this.stateChange.emit({
      companyTitle: c.name ?? '',
      companyID: c.taxId ?? '',
      companyAddress: c.address ?? '',
      companyCity: c.city ?? '',
      companyEmail: c.email ?? '',
      companyPhone: c.phone ?? '',
    });

    this.clientCtrl.setValue(c.name ?? '', { emitEvent: false });
  }

  displayClient = (v: ClientDoc | string | null | undefined) =>
    typeof v === 'object' && v ? v.name : (v ?? '');
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
}

@Component({
  selector: 'invoice-header',
  templateUrl: './invoice-header.component.html',
  styleUrls: ['./invoice-header.component.scss'],
})
export class InvoiceHeaderComponent implements OnInit {
  @Input() companyId!: string;
  @Input() company!: any | null;

  /** Full header state from parent */
  @Input() state!: InvoiceHeaderState;
  /** Emit granular changes up to the parent */
  @Output() stateChange = new EventEmitter<Partial<InvoiceHeaderState>>();
  /** Optional: parent can handle immediate allocation request */
  @Output() reserveNumber = new EventEmitter<void>();

  // client picker
  clientCtrl = new FormControl('');
  clientOptions$: Observable<ClientDoc[]> = of([]);

  /** Remember which client is selected (for Edit) */
  selectedClient: ClientDoc | null = null;

  constructor(
    private clientsSvc: ClientsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.clientOptions$ = this.clientCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((val) => {
        const term = typeof val === 'string' ? val.trim() : val?.name ?? '';
        return term
          ? this.clientsSvc.searchByName(this.companyId, term, 10)
          : of([]);
      })
    );
  }

  /** Emit partial state changes upward */
  set<K extends keyof InvoiceHeaderState>(key: K, value: InvoiceHeaderState[K]) {
    this.stateChange.emit({ [key]: value } as Partial<InvoiceHeaderState>);
  }

  /** Create NEW client via modal */
  async openClientModal() {
    const ref = this.dialog.open(ClientModalComponent, {
      width: '520px',
      data: {},
      disableClose: true,
    });

    const result = await ref.afterClosed().toPromise();
    if (!result) return;

    const id = await this.clientsSvc.create(this.companyId, {
      name: result.name,
      taxId: result.taxId || undefined,
      address: result.address || undefined,
      email: result.email || undefined,
      phone: result.phone || undefined,
    });

    const created = await this.clientsSvc.get(this.companyId, id);
    if (created) this.onSelectClient(created);
  }

  /** Edit currently selected client via modal */
  async openEditClientModal() {
    if (!this.selectedClient) {
      // no client selected yet -> open "new" modal instead
      return this.openClientModal();
    }

    const c = this.selectedClient;
    const ref = this.dialog.open(ClientModalComponent, {
      width: '520px',
      data: {
        name: c.name,
        taxId: c.taxId,
        address: c.address,
        email: c.email,
        phone: c.phone,
      },
      disableClose: true,
    });

    const res = await ref.afterClosed().toPromise();
    if (!res) return;

    await this.clientsSvc.update(this.companyId, c.id!, {
      name: res.name,
      taxId: res.taxId || undefined,
      address: res.address || undefined,
      email: res.email || undefined,
      phone: res.phone || undefined,
      updatedAt: Date.now(),
    });

    // reflect immediately in UI snapshot
    this.onSelectClient({ ...c, ...res } as ClientDoc);
  }

  /** When user picks a client from autocomplete */
  onSelectClient(c: ClientDoc) {
    this.selectedClient = c;

    this.stateChange.emit({
      companyTitle: c.name ?? '',
      companyID: c.taxId ?? '',
      companyAddress: c.address ?? '',
      companyCity: '',
    });

    // show chosen name without re-triggering search
    this.clientCtrl.setValue(c.name ?? '', { emitEvent: false });
  }

  displayClient = (v: ClientDoc | string | null | undefined) =>
    typeof v === 'object' && v ? v.name : v ?? '';
}

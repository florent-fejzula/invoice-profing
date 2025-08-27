import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ClientsService } from 'src/app/services/clients.service';
import { ClientDoc } from 'src/app/models/client.model';

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

  @Input() state!: InvoiceHeaderState;
  @Output() stateChange = new EventEmitter<Partial<InvoiceHeaderState>>();

  // client picker (moved from Dashboard)
  clientCtrl = new FormControl('');
  clientOptions$: Observable<ClientDoc[]> = of([]);

  constructor(private clientsSvc: ClientsService) {}

  ngOnInit(): void {
    this.clientOptions$ = this.clientCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((val) => {
        const term = typeof val === 'string' ? val.trim() : (val?.name ?? '');
        return term ? this.clientsSvc.searchByName(this.companyId, term, 10) : of([]);
      })
    );
  }

  /** Emit partial state changes upward */
  set<K extends keyof InvoiceHeaderState>(key: K, value: InvoiceHeaderState[K]) {
    this.stateChange.emit({ [key]: value } as Partial<InvoiceHeaderState>);
  }

  onSelectClient(c: ClientDoc) {
    // Fill multiple fields at once
    this.stateChange.emit({
      companyTitle: c.name ?? '',
      companyID: c.taxId ?? '',
      companyAddress: c.address ?? '',
      companyCity: '',
    });
    this.clientCtrl.setValue(c.name ?? '', { emitEvent: false });
  }

  displayClient = (v: ClientDoc | string | null | undefined) =>
    typeof v === 'object' && v ? v.name : v ?? '';
}

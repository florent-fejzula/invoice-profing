import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  datum!: Date;
  valuta!: Date;
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  datum = new Date();
  valuta = new Date();
  selectedOption = '';
  fakturaTip = '';
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';
  slobodenOpis = '';
}

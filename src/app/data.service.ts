import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  datum = new Date();
  valuta = new Date();
  selectedOption = '';
  fakturaBroj = '';
  companyTitle = '';
  companyAddress = '';
  companyCity = '';
  companyID = '';
  slobodenOpis = '';
}

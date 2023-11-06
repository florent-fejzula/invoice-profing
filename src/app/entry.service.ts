import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  opis = '';
  em = '';
  kolicina = 0;
  cenaBezDanok = 0;
  rabatProcent = 0;
  rabat = 0;
  ddv = 0;
  iznosSoDDV = 0;
}

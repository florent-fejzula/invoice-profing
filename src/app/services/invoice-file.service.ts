import { Injectable } from '@angular/core';
import { InvoiceItem } from '../models/invoice-item.model';
import { InvoiceHeaderState } from '../pages/invoice-app/dashboard/invoice-header/invoice-header.component';

export interface InvoiceJsonPayload {
  // header
  datum: string | number | Date;
  valuta: string | number | Date;
  fakturaTip: string;
  fakturaBroj: string;
  companyTitle: string;
  companyAddress: string;
  companyCity: string;
  companyID: string;
  companyEmail?: string;
  companyPhone?: string;

  // extra fields
  slobodenOpis: string;
  napomena: string;
  vkupenIznosBezDDV: number;
  vkupnoDDV: number;
  soZborovi: string;

  // items
  items: InvoiceItem[];
}

@Injectable({ providedIn: 'root' })
export class InvoiceFileService {
  /** Build the JSON payload from the current UI state */
  buildPayload(
    header: InvoiceHeaderState,
    slobodenOpis: string,
    napomena: string,
    soZborovi: string,
    vkupenIznosBezDDV: number,
    vkupnoDDV: number,
    items: InvoiceItem[]
  ): InvoiceJsonPayload {
    return {
      datum: header.datum,
      valuta: header.valuta,
      fakturaTip: header.fakturaTip,
      fakturaBroj: header.fakturaBroj,
      companyTitle: header.companyTitle,
      companyAddress: header.companyAddress,
      companyCity: header.companyCity,
      companyID: header.companyID,
      companyEmail: header.companyEmail,
      companyPhone: header.companyPhone,
      slobodenOpis,
      napomena,
      vkupenIznosBezDDV,
      vkupnoDDV,
      soZborovi,
      items,
    };
  }

  /** Trigger a download of the given payload as JSON */
  downloadJson(
    payload: InvoiceJsonPayload,
    fileName = 'invoice_data.json'
  ): void {
    const jsonString = JSON.stringify(payload, null, 2);

    // Modern File System Access API
    if ('showSaveFilePicker' in window) {
      // @ts-ignore
      this.saveWithFilePicker(jsonString, fileName);
    } else {
      this.saveWithAnchor(jsonString, fileName);
    }
  }

  /** Parse a File object and return the JSON payload */
  async parseJsonFile(file: File): Promise<InvoiceJsonPayload> {
    const text = await file.text();
    const data = JSON.parse(text);
    return data as InvoiceJsonPayload;
  }

  // ---------- private helpers ----------

  private async saveWithFilePicker(jsonString: string, suggestedName: string) {
    try {
      const options = {
        suggestedName,
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      };
      // @ts-ignore
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
    } catch (err) {
      console.error('File save cancelled or failed:', err);
    }
  }

  private saveWithAnchor(jsonString: string, fileName: string) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

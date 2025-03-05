import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { collection, query, where } from 'firebase/firestore';
import { map } from 'rxjs';

interface TableRow {
  redenBrojArea: string;
  textAreaInput: string;
  kolicinaArea: string;
  merkaArea: string;
  cenaArea: string;
  vkupnoArea: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  company: any = null;
  user: any = null;

  gradbaBroj: string = '';
  gradbaInputValue: string = '';
  knigaInputValue: string = '';
  datumInputValue: string = '';
  investorInputValue: string = '';
  adresaInputValue: string = '';
  pozicijaInputValue: string = '';
  merkaInputValue: string = '';
  cenaInputValue: number | undefined;
  exportFileName: string = 'exported-data.json'; // Default file name

  fontSize: number = 16;
  fontSizePozicija: number = 20;

  tableData: TableRow[] = [
    {
      redenBrojArea: '1',
      textAreaInput: '',
      kolicinaArea: '',
      merkaArea: '',
      cenaArea: '',
      vkupnoArea: '',
    },
  ];

  div4InputValue: number = 0;
  isDiv4InputDisabled: boolean = true;

  constructor(private auth: Auth, private firestore: Firestore) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user && user.email) {
        this.user = user;
        this.loadCompanyData(user.email);
      }
    });
  }

  loadCompanyData(email: string | null) {
    if (!email) return; // ✅ If email is null, exit the function

    const companyQuery = query(
      collection(this.firestore, 'companies'),
      where('email', '==', email)
    );

    collectionData(companyQuery, { idField: 'id' })
      .pipe(map((companies) => companies[0] || { name: 'Company Not Found' }))
      .subscribe((companyData) => {
        this.company = companyData;
      });
  }

  increaseFontSize() {
    this.fontSize += 1;
  }

  decreaseFontSize() {
    this.fontSize = Math.max(10, this.fontSize - 1);
  }

  increasePozicijaFontSize() {
    this.fontSizePozicija += 1;
  }

  decreasePozicijaFontSize() {
    this.fontSizePozicija = Math.max(10, this.fontSizePozicija - 1);
  }

  async exportToJson(): Promise<void> {
    // Gather the data to export
    const dataToExport = {
      gradbaBroj: this.gradbaBroj,
      gradbaInputValue: this.gradbaInputValue,
      knigaInputValue: this.knigaInputValue,
      datumInputValue: this.datumInputValue,
      investorInputValue: this.investorInputValue,
      adresaInputValue: this.adresaInputValue,
      pozicijaInputValue: this.pozicijaInputValue,
      tableData: this.tableData,
      div4InputValue: this.div4InputValue,
    };

    // Convert the data to a formatted JSON string
    const jsonString = JSON.stringify(dataToExport, null, 2);

    // Use the File System Access API if available
    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: 'gradezhna_kniga_data.json',
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        };
        // @ts-ignore: TypeScript may not yet have this in its DOM typings.
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
      } catch (error) {
        console.error('File save cancelled or failed:', error);
      }
    } else {
      // Fallback: Automatically download with a default name.
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gradezhna_kniga_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  importJson(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(reader.result as string);

          this.gradbaBroj = importedData.gradbaBroj || '';
          this.gradbaInputValue = importedData.gradbaInputValue || '';
          this.knigaInputValue = importedData.knigaInputValue || '';
          this.datumInputValue = importedData.datumInputValue || '';
          this.investorInputValue = importedData.investorInputValue || '';
          this.adresaInputValue = importedData.adresaInputValue || '';
          this.pozicijaInputValue = importedData.pozicijaInputValue || '';
          this.tableData = importedData.tableData || [];
          this.div4InputValue = importedData.div4InputValue || 0;
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };

      reader.readAsText(file);
    }
  }

  addNewRow() {
    const nextRedenBroj = this.tableData.length + 1;
    this.tableData.push({
      redenBrojArea: nextRedenBroj.toString(),
      textAreaInput: '',
      kolicinaArea: '',
      merkaArea: '',
      cenaArea: '',
      vkupnoArea: '',
    });
    this.calculateDiv4InputValue();
  }

  calculateVkupnoArea(row: TableRow) {
    const kolicina = parseFloat(row.kolicinaArea);
    const cena = parseFloat(row.cenaArea);
    if (!isNaN(kolicina) && !isNaN(cena)) {
      row.vkupnoArea = (kolicina * cena).toFixed(2);
    } else {
      row.vkupnoArea = '';
    }
    this.calculateDiv4InputValue();
  }

  calculateDiv4InputValue() {
    const total = this.tableData.reduce((total, row) => {
      return total + (parseFloat(row.vkupnoArea) || 0);
    }, 0);

    // Append .00 to the formatted total
    const formattedTotal = total.toFixed(2) + '.00';

    this.div4InputValue = parseFloat(formattedTotal);
  }

  removeRow(index: number) {
    this.tableData.splice(index, 1);
  }

  printThisPage() {
    window.print();
  }
}

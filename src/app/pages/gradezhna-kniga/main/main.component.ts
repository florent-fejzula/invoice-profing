import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

import { CompanyService } from 'src/app/services/company.service';
import {
  GradezhnaKnigaPayload,
  GradezhnaKnigaTableRow,
} from 'src/app/models/gradezhna-kniga.model';
import { GradezhnaKnigaFileService } from 'src/app/services/gradezhna-kniga-file.service';
import {
  GradezhnaKnigaPersistenceService,
  GradezhnaKnigaEditorData,
} from 'src/app/services/gradezhna-kniga-persistence.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  company: any = null;
  user: any = null;

  companyId = 'GLp2xLv3ZzX6ktQZUsyU';
  currentBookId: string | null = null;

  gradbaBroj = '';
  gradbaInputValue = '';
  knigaInputValue = '';
  datumInputValue = '';
  investorInputValue = '';
  adresaInputValue = '';
  pozicijaInputValue = '';
  merkaInputValue = '';
  cenaInputValue: number | undefined;
  exportFileName = 'gradezhna_kniga_data.json';

  fontSize = 16;
  fontSizePozicija = 20;

  tableData: GradezhnaKnigaTableRow[] = [
    {
      redenBrojArea: '1',
      textAreaInput: '',
      kolicinaArea: '',
      merkaArea: '',
      cenaArea: '',
      vkupnoArea: '',
    },
  ];

  div4InputValue = 0;
  isDiv4InputDisabled = true;

  constructor(
    private auth: Auth,
    private companyService: CompanyService,
    private snack: MatSnackBar,
    private fileService: GradezhnaKnigaFileService,
    private persistence: GradezhnaKnigaPersistenceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;

      if (user) {
        this.companyService.getCompany().subscribe((data) => {
          if (data) {
            this.company = data;
            if ((data as any).id) {
              this.companyId = (data as any).id;
            }
          }
        });
      }
    });

    // React to ?bookId=... like we do for invoices
    this.route.queryParamMap.subscribe((params) => {
      const bookId = params.get('bookId');
      if (bookId) {
        this.loadFromFirestore(bookId);
      } else {
        // new blank book
        this.currentBookId = null;
        this.resetForm();
      }
    });
  }

  /** ---------- helpers for state ---------- */

  private getEmptyRow(): GradezhnaKnigaTableRow {
    return {
      redenBrojArea: '1',
      textAreaInput: '',
      kolicinaArea: '',
      merkaArea: '',
      cenaArea: '',
      vkupnoArea: '',
    };
  }

  private resetForm() {
    this.gradbaBroj = '';
    this.gradbaInputValue = '';
    this.knigaInputValue = '';
    this.datumInputValue = '';
    this.investorInputValue = '';
    this.adresaInputValue = '';
    this.pozicijaInputValue = '';
    this.merkaInputValue = '';
    this.cenaInputValue = undefined;
    this.tableData = [this.getEmptyRow()];
    this.div4InputValue = 0;
  }

  /** Build payload from current UI state */
  private buildPayload(): GradezhnaKnigaPayload {
    return this.fileService.buildPayload({
      gradbaBroj: this.gradbaBroj,
      gradbaInputValue: this.gradbaInputValue,
      knigaInputValue: this.knigaInputValue,
      datumInputValue: this.datumInputValue,
      investorInputValue: this.investorInputValue,
      adresaInputValue: this.adresaInputValue,
      pozicijaInputValue: this.pozicijaInputValue,
      merkaInputValue: this.merkaInputValue,
      cenaInputValue: this.cenaInputValue,
      tableData: this.tableData,
      div4InputValue: this.div4InputValue,
    });
  }

  /** Apply payload into UI state */
  private applyPayload(payload: GradezhnaKnigaPayload) {
    this.gradbaBroj = payload.gradbaBroj || '';
    this.gradbaInputValue = payload.gradbaInputValue || '';
    this.knigaInputValue = payload.knigaInputValue || '';
    this.datumInputValue = payload.datumInputValue || '';
    this.investorInputValue = payload.investorInputValue || '';
    this.adresaInputValue = payload.adresaInputValue || '';
    this.pozicijaInputValue = payload.pozicijaInputValue || '';
    this.merkaInputValue = payload.merkaInputValue || '';
    this.cenaInputValue = payload.cenaInputValue;
    this.tableData = payload.tableData || [this.getEmptyRow()];
    this.div4InputValue = payload.div4InputValue ?? 0;
  }

  /** ---------- UI FONT CONTROLS ---------- */
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

  /** ---------- JSON EXPORT / IMPORT ---------- */
  async exportToJson(): Promise<void> {
    const payload = this.buildPayload();
    this.fileService.downloadJson(payload, this.exportFileName);
  }

  async importJson(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imported = await this.fileService.parseJsonFile(file);
      this.currentBookId = null; // local file, not bound to Firestore
      this.applyPayload(imported);
    } catch (err) {
      console.error('Error parsing JSON file:', err);
      this.snack.open('Грешка при вчитување JSON.', 'OK', {
        duration: 3000,
        panelClass: 'snack-error',
      });
    }
  }

  /** ---------- FIRESTORE SAVE ---------- */
  async saveToFirestore(): Promise<void> {
    if (!this.user) {
      this.snack.open('Најавете се за да зачувате во облак.', 'OK', {
        duration: 3000,
      });
      return;
    }

    try {
      const payload = this.buildPayload();

      const result = await this.persistence.save({
        companyId: this.companyId,
        currentBookId: this.currentBookId,
        userUid: this.user.uid,
        payload,
      });

      this.currentBookId = result.id;

      const msg = result.isNew
        ? 'Градежната книга е зачувана во облак.'
        : 'Градежната книга е ажурирана.';

      this.snack.open(msg, 'OK', {
        duration: 3000,
        panelClass: 'snack-success',
      });
    } catch (err) {
      console.error('Failed saving Gradezhna Kniga:', err);
      this.snack.open('Грешка при зачувување на градежната книга.', 'OK', {
        duration: 4000,
        panelClass: 'snack-error',
      });
    }
  }

  /** ---------- FIRESTORE LOAD (from list / URL) ---------- */
  async loadFromFirestore(bookId: string): Promise<void> {
    try {
      const data: GradezhnaKnigaEditorData = await this.persistence.loadForEdit(
        this.companyId,
        bookId
      );

      this.currentBookId = data.id;
      this.applyPayload(data.payload);
    } catch (err) {
      console.error('Failed to load Gradezhna Kniga', err);
      this.snack.open('Грешка при вчитување на градежната книга.', 'OK', {
        duration: 4000,
        panelClass: 'snack-error',
      });
    }
  }

  /** ---------- TABLE ROWS & TOTALS ---------- */
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

  calculateVkupnoArea(row: GradezhnaKnigaTableRow) {
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
    const total = this.tableData.reduce((sum, row) => {
      return sum + (parseFloat(row.vkupnoArea) || 0);
    }, 0);

    this.div4InputValue = parseFloat(total.toFixed(2));
  }

  removeRow(index: number) {
    this.tableData.splice(index, 1);
    this.calculateDiv4InputValue();
  }

  /** ---------- PRINT ---------- */
  printThisPage() {
    window.print();
  }
}

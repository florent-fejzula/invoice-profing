import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CompanyService } from 'src/app/services/company.service';
import { GradezhnaKnigaService } from 'src/app/services/gradezhna-kniga.service';
import { GradezhnaKnigaDoc } from 'src/app/models/gradezhna-kniga.model';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-gradezhna-list',
  templateUrl: './gradezhna-list.component.html',
  styleUrls: ['./gradezhna-list.component.scss'],
})
export class GradezhnaListComponent implements OnInit {
  companyId = '';

  books: GradezhnaKnigaDoc[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private companyService: CompanyService,
    private gkService: GradezhnaKnigaService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.companyService
      .getCompany()
      .pipe(
        filter((c: any) => !!c?.id),
        take(1)
      )
      .subscribe({
        next: (company: any) => {
          this.companyId = company.id;
          this.loadBooks();
        },
        error: (err) => {
          console.error('Failed to resolve company', err);
          this.error = 'Не успеав да ја вчитам компанијата.';
          this.isLoading = false;
        },
      });
  }

  async loadBooks() {
    if (!this.companyId) return;
    this.isLoading = true;
    this.error = null;
    try {
      this.books = await this.gkService.list(this.companyId, 200);
    } catch (err) {
      console.error('Failed to load Gradezhna Kniga docs', err);
      this.error = 'Не успеав да ги вчитам градежните книги.';
    } finally {
      this.isLoading = false;
    }
  }

  openBook(book: GradezhnaKnigaDoc) {
    if (!book.id) return;
    this.router.navigate(['/gradezhna-kniga'], {
      queryParams: { bookId: book.id },
    });
  }

  async deleteBook(book: GradezhnaKnigaDoc) {
    if (!book.id) return;

    const ok = confirm(
      `Дали сте сигурни дека сакате да ја избришете оваа градежна книга?`
    );
    if (!ok) return;

    try {
      await this.gkService.delete(this.companyId, book.id);
      this.books = this.books.filter((b) => b.id !== book.id);

      this.snack.open('Градежната книга е избришана.', 'OK', {
        duration: 2500,
        panelClass: 'snack-success',
      });
    } catch (err) {
      console.error('Failed to delete Gradezhna Kniga', err);
      this.snack.open('Грешка при бришење на градежната книга.', 'OK', {
        duration: 3500,
        panelClass: 'snack-error',
      });
    }
  }
}

import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.email, this.password).subscribe(
      (res) => {
        console.log('User logged in:', res);
        this.router.navigate(['/dashboard']); // Redirect to dashboard
      },
      (err) => {
        console.error('Login failed:', err);
        alert('Login failed: ' + err.message); // Show error to user
      }
    );
  }
}

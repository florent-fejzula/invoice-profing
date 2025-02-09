import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.email, this.password).subscribe(
      ({ user, status }) => {
        console.log('User logged in:', user, 'Status:', status);
        if (status === 'active') {
          this.router.navigate(['/dashboard']);
        } else {
          alert('Your account is inactive.');
          this.authService.logout();
        }
      },
      (err) => {
        console.error('Login failed:', err);
        alert('Login failed: ' + err.message);
      }
    );
  }
}

// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginData = {
    email: '',
    password: ''
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  constructor(private router: Router, private http: HttpClient) {}

  onSubmit(): void {
    // Validaciones simples con if
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (!this.loginData.email.includes('@')) {
      this.errorMessage = 'Email no válido';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Enviar datos al backend
    this.http.post('http://localhost:3000/api/auth/login', this.loginData)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.successMessage = '¡Login exitoso! Redirigiendo...';
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1500);
          } else {
            this.errorMessage = 'No se recibió token del servidor';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error en el login. Verifica tus credenciales.';
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
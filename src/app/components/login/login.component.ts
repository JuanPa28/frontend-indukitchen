import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginData = {
    email: '',
    password: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  protected signInFn(auth: Auth, email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  onSubmit(): void {
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

    this.signInFn(this.auth, this.loginData.email, this.loginData.password)
      .then((userCredential: unknown) => {
        this.isLoading = false;
        this.successMessage = '¡Login exitoso! Redirigiendo...';
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1500);
      })
      .catch((error: any) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Error en el login. Verifica tus credenciales.';
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}

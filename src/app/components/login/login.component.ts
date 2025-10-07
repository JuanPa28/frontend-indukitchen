import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { ADMIN_EMAIL } from '../../admin.guard';

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
      .then(() => {
        this.isLoading = false;
        const email = this.loginData.email.trim().toLowerCase();
        const dest = email === ADMIN_EMAIL ? '/admin' : '/products';
        this.successMessage = '¡Login exitoso! Redirigiendo...';
        this.router.navigate([dest]);
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

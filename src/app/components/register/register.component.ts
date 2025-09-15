// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  // Datos del formulario basados en el backend
  userData = {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    phone: '',
    dni: '',
    address: ''
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(private router: Router, private http: HttpClient) {}

  onSubmit(): void {
    // Validaciones simples con if
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Preparar datos para enviar al backend (sin confirmPassword)
    const { confirmPassword, ...userToSend } = this.userData;

    this.http.post('http://localhost:3000/api/auth/register', userToSend)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Error en el registro. Por favor, intenta nuevamente.';
        }
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private validateForm(): boolean {
    // Validar que todos los campos estén llenos
    const fields = Object.values(this.userData);
    if (fields.some(field => !field || field.toString().trim() === '')) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      return false;
    }

    // Validar contraseñas
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    // Validar longitud de contraseña
    if (this.userData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    // Validar teléfono (solo números, mínimo 10 dígitos)
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(this.userData.phone) || this.userData.phone.length < 10) {
      this.errorMessage = 'Teléfono no válido (solo números, mínimo 10 dígitos)';
      return false;
    }

    // Validar DNI (solo números, 8-12 dígitos)
    const dniRegex = /^[0-9]+$/;
    if (!dniRegex.test(this.userData.dni) || this.userData.dni.length < 8 || this.userData.dni.length > 12) {
      this.errorMessage = 'DNI no válido (solo números, 8-12 dígitos)';
      return false;
    }

    // Validar nombre y apellido (solo letras y espacios)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(this.userData.name)) {
      this.errorMessage = 'El nombre solo puede contener letras y espacios';
      return false;
    }

    if (!nameRegex.test(this.userData.lastName)) {
      this.errorMessage = 'El apellido solo puede contener letras y espacios';
      return false;
    }

    return true;
  }
}
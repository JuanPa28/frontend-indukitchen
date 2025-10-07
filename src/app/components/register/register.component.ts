import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth/auth.service';
import { ClienteService } from '../../services/client/client.service';
import { ClienteDto } from '../../services/client/client.dto';
import { forkJoin, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  userData = {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    phone: '',
    dni: '',
    address: '',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly authService = inject(AuthService);
  private readonly clienteService = inject(ClienteService);

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const dni = this.userData.dni.trim();
    const email = this.userData.email.trim().toLowerCase();

    try {
      const dupChecks = await firstValueFrom(
        forkJoin({
          dniTaken: this.clienteService.existsByCedula(dni),
          emailTaken: this.clienteService.existsByCorreo(email),
        })
      );

      if (dupChecks.dniTaken) {
        this.isLoading = false;
        this.errorMessage = 'La cédula ya está registrada.';
        return;
      }
      if (dupChecks.emailTaken) {
        this.isLoading = false;
        this.errorMessage = 'El correo ya está registrado.';
        return;
      }

      await this.authService.register(this.userData.email, this.userData.password);

      const cliente: ClienteDto = {
        cedula: dni,
        nombre: `${this.userData.name.trim()} ${this.userData.lastName.trim()}`.trim(),
        direccion: this.userData.address.trim(),
        correo: email,
        telefono: this.userData.phone.trim(),
      };

      await firstValueFrom(
        this.clienteService.create(cliente).pipe(
          catchError((err) => {
            const msg =
              err?.status === 409
                ? 'La cédula o correo ya existe en el sistema.'
                : 'La cuenta fue creada, pero no se pudo guardar el cliente. Intenta nuevamente más tarde.';
            throw new Error(msg);
          })
        )
      );

      this.isLoading = false;
      this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error?.message || 'Error en el registro. Por favor, intenta nuevamente.';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private validateForm(): boolean {
    const fields = Object.values(this.userData);
    if (fields.some((field) => !field || field.toString().trim() === '')) {
      this.errorMessage = 'Todos los campos son obligatorios';
      return false;
    }

    const emailRegex = /^[^\s@]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(this.userData.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      return false;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return false;
    }

    if (this.userData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }

    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(this.userData.phone) || this.userData.phone.length < 10) {
      this.errorMessage = 'Teléfono no válido (solo números, mínimo 10 dígitos)';
      return false;
    }

    const dniRegex = /^\d+$/;
    if (
      !dniRegex.test(this.userData.dni) ||
      this.userData.dni.length < 8 ||
      this.userData.dni.length > 12
    ) {
      this.errorMessage = 'DNI no válido (solo números, 8-12 dígitos)';
      return false;
    }

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

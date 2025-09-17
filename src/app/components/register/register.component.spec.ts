import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth/auth.service';

class RouterMock {
  navigate = jasmine.createSpy('navigate');
}

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let router: RouterMock;
  let authMock: any;
  let authServiceMock: any;

  beforeEach(async () => {
    router = new RouterMock();
    authMock = {};
    authServiceMock = {
      register: jasmine.createSpy('register'),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: Auth, useValue: authMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    (component as any).auth = authMock;
    (component as any).authService = authServiceMock;
    (component as any).router = router;
  });

  it('debería inicializar el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Validaciones del formulario', () => {
    it('debería marcar error si hay campos vacíos', () => {
      component.userData = {
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        lastName: '',
        phone: '',
        dni: '',
        address: '',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('Todos los campos son obligatorios');
    });

    it('debería marcar error si el email es inválido', () => {
      component.userData = {
        email: 'bademail',
        password: '123456',
        confirmPassword: '123456',
        name: 'Juan',
        lastName: 'Perez',
        phone: '1234567890',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('Por favor ingresa un email válido');
    });

    it('debería marcar error si las contraseñas no coinciden', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123456',
        confirmPassword: '654321',
        name: 'Juan',
        lastName: 'Perez',
        phone: '1234567890',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('Las contraseñas no coinciden');
    });

    it('debería marcar error si el teléfono es inválido', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123456',
        confirmPassword: '123456',
        name: 'Juan',
        lastName: 'Perez',
        phone: 'abc123',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('Teléfono no válido');
    });

    it('debería marcar error si el DNI es inválido', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123456',
        confirmPassword: '123456',
        name: 'Juan',
        lastName: 'Perez',
        phone: '1234567890',
        dni: '12',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('DNI no válido');
    });

    it('debería pasar validación con datos válidos', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123456',
        confirmPassword: '123456',
        name: 'Juan',
        lastName: 'Perez',
        phone: '1234567890',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeTrue();
    });

    it('debería marcar error si la contraseña es muy corta', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123',
        confirmPassword: '123',
        name: 'Juan',
        lastName: 'Perez',
        phone: '1234567890',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('La contraseña debe tener al menos 6 caracteres');
    });

    it('debería marcar error si el nombre contiene caracteres inválidos', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123456',
        confirmPassword: '123456',
        name: 'Jua4n',
        lastName: 'Perez',
        phone: '1234567890',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('El nombre solo puede contener letras y espacios');
    });

    it('debería marcar error si el apellido contiene caracteres inválidos', () => {
      component.userData = {
        email: 'test@mail.com',
        password: '123456',
        confirmPassword: '123456',
        name: 'Juan',
        lastName: 'P3rez',
        phone: '1234567890',
        dni: '12345678',
        address: 'Calle',
      };
      expect(component['validateForm']()).toBeFalse();
      expect(component.errorMessage).toContain('El apellido solo puede contener letras y espacios');
    });
  });

  describe('onSubmit', () => {
    it('debería no continuar si el formulario es inválido', () => {
      spyOn<any>(component, 'validateForm').and.returnValue(false);
      component.onSubmit();
      expect(component.isLoading).toBeFalse();
    });

    it('debería manejar registro exitoso y redirigir', fakeAsync(() => {
      spyOn<any>(component, 'validateForm').and.returnValue(true);
      const mockUserCredential = {
        user: {},
        providerId: 'firebase',
        operationType: 'signIn',
      } as any;
      const mockPromise = Promise.resolve(mockUserCredential);

      authServiceMock.register.and.returnValue(mockPromise);

      spyOn<any>(window, 'setTimeout').and.callFake((fn: Function) => fn());
      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toContain('¡Registro exitoso!');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('debería manejar error en el registro', fakeAsync(() => {
      spyOn<any>(component, 'validateForm').and.returnValue(true);
      const mockPromise = Promise.reject(new Error('Firebase error'));

      authServiceMock.register.and.returnValue(mockPromise);

      component.onSubmit();
      mockPromise.catch(() => {});
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain('Firebase error');
    }));

    it('debería usar mensaje fallback cuando error no tiene message', fakeAsync(() => {
      spyOn<any>(component, 'validateForm').and.returnValue(true);
      const mockPromise = Promise.reject(new Error());
      authServiceMock.register.and.returnValue(mockPromise);

      component.onSubmit();
      mockPromise.catch(() => {});
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain(
        'Error en el registro. Por favor, intenta nuevamente.'
      );
    }));
  });

  describe('togglePasswordVisibility', () => {
    it('debería alternar showPassword', () => {
      expect(component.showPassword).toBeFalse();
      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue();
    });

    it('debería alternar showConfirmPassword', () => {
      expect(component.showConfirmPassword).toBeFalse();
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword).toBeTrue();
    });
  });
});

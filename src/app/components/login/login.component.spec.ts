import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authMock: any;

  beforeEach(async () => {
    authMock = {};

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: Auth, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('debería crear', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar error si los campos están vacíos', () => {
    component.loginData.email = '';
    component.loginData.password = '';
    component.onSubmit();
    expect(component.errorMessage).toContain('Por favor completa todos los campos');
    expect(component.isLoading).toBeFalse();
  });

  it('debería mostrar error si el email es inválido', () => {
    component.loginData.email = 'bademail';
    component.loginData.password = '123456';
    component.onSubmit();
    expect(component.errorMessage).toContain('Email no válido');
    expect(component.isLoading).toBeFalse();
  });

  it('debería iniciar sesión correctamente y navegar', fakeAsync(() => {
    component.loginData.email = 'test@example.com';
    component.loginData.password = 'pw1234';

    const mockResult = { user: { uid: 'u1' } } as any;
    const signInSpy = spyOn(component as any, 'signInFn').and.returnValue(
      Promise.resolve(mockResult)
    );
    spyOn(router, 'navigate');

    component.onSubmit();
    expect(component.isLoading).toBeTrue();

    flushMicrotasks();

    expect(signInSpy).toHaveBeenCalledWith(authMock, 'test@example.com', 'pw1234');
    expect(component.isLoading).toBeFalse();
    expect(component.successMessage).toContain('¡Login exitoso!');

    tick(1500);
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  }));

  it('debería manejar error de login y establecer errorMessage', fakeAsync(() => {
    component.loginData.email = 'test@example.com';
    component.loginData.password = 'pw1234';

    const err = new Error('invalid credentials');
    spyOn(component as any, 'signInFn').and.returnValue(Promise.reject(err));

    component.onSubmit();
    flushMicrotasks();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('invalid credentials');
  }));

  it('signInFn debería delegar en signInWithEmailAndPassword', fakeAsync(() => {
    const p: any = (component as any).signInFn(authMock, 'a@b.c', 'pw');
    expect(p).toBeTruthy();
    expect(typeof p.then).toBe('function');
    p.catch(() => {});
  }));

  it('debería usar mensaje por defecto cuando el error no tiene message', fakeAsync(() => {
    component.loginData.email = 'test@example.com';
    component.loginData.password = 'pw1234';

    const errNoMessage: Error = new Error();
    (errNoMessage as any).message = undefined;
    spyOn(component as any, 'signInFn').and.returnValue(Promise.reject(errNoMessage));

    component.onSubmit();
    flushMicrotasks();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Error en el login. Verifica tus credenciales.');
  }));

  it('togglePasswordVisibility debería invertir el booleano', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });
});

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('permite el acceso cuando hay usuario (resuelve true) y no navega', async () => {
    const unsubSpy = jasmine.createSpy('unsub');
    const authMock: any = {
      onAuthStateChanged: (cb: (u: any) => void) => {
        setTimeout(() => cb({ uid: 'u1' }), 0);
        return unsubSpy;
      },
    };
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(unsubSpy).toHaveBeenCalled();
  });

  it('redirige a /login cuando no hay usuario (resuelve false) y llama a navigate', async () => {
    const unsubSpy = jasmine.createSpy('unsub');
    const authMock: any = {
      onAuthStateChanged: (cb: (u: any) => void) => {
        setTimeout(() => cb(null), 0);
        return unsubSpy;
      },
    };
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(unsubSpy).toHaveBeenCalled();
  });
});
